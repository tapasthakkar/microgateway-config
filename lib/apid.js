const fs = require('fs');
const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const util = require('util');
const url = require('url');
const async = require('async');
const debug_ = require('debug');
const request = require('request');
const yaml = require('js-yaml');
const _ = require('lodash');
//TODO reintroduce config validation
const default_config_validator = require('./default-validator');
const proxy_validator = require('./proxy-validator');
const debug = debug_('agent:config');
const ioLib = require('./io');
const Handlebars = require('handlebars')

const Apid = function (io) {
    this.io = io || ioLib();
    this.deploymentIds = [];
};

module.exports = function () {
    return new Apid();
};

/*
Retrieve configuration from apid
 */
Apid.prototype.get = function (options, callback) {
    var self = this;
    this.apidEndpoint = options.apidEndpoint;
    request.get({url: this.apidEndpoint + '/deployments'}, function (err, response, body) {

        if(err) {
          return callback(err);
        }

        var parsedBody = JSON.parse(body);
        
        const currentDeploymentIds = parsedBody.map((bundleConfig) => {
          return bundleConfig.id;
        });

        if(parsedBody && !parsedBody.length) {
          return callback(new Error('No deployments found'))
        }

        self._processResponse(self.apidEndpoint, response, body, (err, newConfig) => {
            var stateToReport = [];

            //Error retrieving deployments. Callback with the error. Report the
            //deployment as a failure
            if(err) {
              currentDeploymentIds.forEach((deploymentId) => {
                const reportObject = self._createError(deploymentId, err);
                stateToReport.push(reportObject);
              });
              self._reportStatus(stateToReport);
              return callback(err);
            }

            //If the status code was 200
            //Go through the wire up process, and callback with new config
            if(response.statusCode == 200) {
              self.etagValue = response.headers['etag'];

              var systemConfig;
              try {
                systemConfig = yaml.safeLoad(fs.readFileSync(options.systemConfigPath));
              } catch(e) {
                return callback(e);
              }
              
              newConfig = Object.assign(newConfig, systemConfig);
              
              self.deploymentIds = currentDeploymentIds;
              self.deploymentIds.forEach((deploymentId) => {
                var reportObject = self._createSuccess(deploymentId);
                stateToReport.push(reportObject);
              });
              self._reportStatus(stateToReport);
              callback(err, newConfig);
            }             
        });
    });
}

Apid.prototype.beginLongPoll = function(clientSocket, pollInterval, retry) {
    var self = this;
    if(!pollInterval) {
        pollInterval = 100;
    }
    var options = {
        url: this.apidEndpoint+'/deployments',
        headers: {
            "If-None-Match": this.etagValue,
        },
        qs: {
            block: pollInterval
        }
    }

    request.get(options, function (err, response, body) {
        if (err) {
            console.log("Error long polling apid. Waiting 10 second then will retry...", err.message);
            
            if(retry) {
              setTimeout(()=>{
                self.beginLongPoll(clientSocket);
              }, 10000)
            }
        }
        else if (response.statusCode == 304) {
            console.log("No change from apid reported.  Will retry...");
            self.beginLongPoll(clientSocket);
        } else {
            var parsedBody = JSON.parse(body);
            var currentDeploymentIds = parsedBody.map((bundleConfig) => {
              return bundleConfig.id;
            })

            self._processResponse(self.apidEndpoint, response, body, function (err, newConfig) {

                //Look for the difference between current running state, and 
                //proposed state. Report back the new deployments accordingly.
                if(Array.isArray(self.deploymentIds)) {
                  var proposedState = [];
                  var stateToReport = [];
                  currentDeploymentIds.forEach((deploymentId) => {
                    //It not in current running state
                    if(self.deploymentIds.indexOf(deploymentId) < 0) {
                      if(err) {
                        //Report error against current running state
                        var reportObject = self._createError(deploymentId, err);
                        stateToReport.push(reportObject);
                      } else {
                        //Report success and add to current running state
                        var reportObject = self._createSuccess(deploymentId);
                        stateToReport.push(reportObject);
                        proposedState.push(deploymentId);
                      }
                    } else {
                      //Just add to new current state because it's already valid and running
                      proposedState.push(deploymentId);
                    }
                  });

                  //Double check that out proposed state isn't empty
                  //meaning complete deployment failure
                  self._reportStatus(stateToReport);
                  if(proposedState.length) {
                    self.deploymentIds = proposedState;
                  } else {
                    console.error('Complete deployment failure. Maintaining old deployment state.')
                  }
                  
                }

                //If there is an error setup polling again
                if(err) {
                  self.beginLongPoll(clientSocket);
                  return console.error(util.format('error: Error getting deployments for gateway: %s not restarting.', err.message))
                }
          
                //If there wasn't an error, and we have a good config let's restart edgemicro
                process.env.CONFIG = JSON.stringify(newConfig);
                clientSocket.sendMessage({command: 'reload'});
                self.beginLongPoll(clientSocket);
            });
        }
    });
}

/* place config defaults here */
const configDefaults = {
    'analytics-apid': {
        compress: true,
        apidEndpoint: '',
        flushInterval: 250
    }
};

const applyDefaults = function(config) {
    return _.merge({}, configDefaults, config);
}

const merge = function(baseConfig, override) {
    //apply vhost overrides
    override.system.vhosts.keys().forEach(vhost => {
        var toOverride = baseConfig.system.vhosts.keys().find(key => key == vhost);
        if (baseConfig.system.vhosts && toOverride) {
            vhost.keys().forEach(key => toOverride[key] = vhost[key]);
        }
    });

    //apply  system overrides
    var systemKeys = override.system.keys();
    delete systemKeys['vhosts'];
    systemKeys.forEach(key => baseConfig.system[key] = override.system[key]);

    //TODO implement merging for other entities.
    return baseConfig;
}

/*
General helper function for reporting status back to apid
 */
Apid.prototype._reportStatus = function(json) {
  const endpoint = util.format('%s/deployments', this.apidEndpoint);
  const opts = {
    url: endpoint,
    json: json,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  request.put(opts, function(err, resp, body){
    if (err) {
      console.error("Failed to PUT deployment status back to apid", err.message);
    } else {
      console.log("Successfully PUT deployment status back to apid.");
    }
  });
}

/*
Report SUCCESS status back to apid for deployment id
 */
Apid.prototype._createSuccess = function(deploymentId) {
    return {
      id: deploymentId,
      status: 'SUCCESS'
    };
}

/*
Report FAIL status back to apid for given deployment id and error object
 */
Apid.prototype._createError = function(deploymentId, err) {
  return {
    id: deploymentId,
    status: 'FAIL',
    message: err.message,
    code: 1
  };
}

/*
Extract proxies from each scope and bundle up into a top level 'proxies' object for convenience
 */
const formatConfig = function(config) {
    var gatheredProxies = [];
    Object.keys(config.scopes).forEach((scope) => {
        let curScope = config.scopes[scope]
        Object.keys(curScope.proxies).forEach((key) => {
            curScope.proxies[key]['scope'] = scope;
            //Edgemicro only uses this proxies array. We update each proxy 
            //To use the key as the proxy_name as it is a better identifier.
            curScope.proxies[key]['proxy_name'] = key;
            gatheredProxies.push(curScope.proxies[key])});
    })
    config.proxies = gatheredProxies;
    return config;
}

Apid.prototype.stitch = function(config) {
    var self = this;

    //Function to merge configurations based on precedent
    const mergeConfigs = (scopeConfig, bundleConfig) => {
      var obj = {};
      Object.keys(scopeConfig).forEach((k) => {
        obj[k] = scopeConfig[k];
      });

      Object.keys(bundleConfig).forEach((k) => {
        obj[k] = bundleConfig[k];
      });

      return obj;
    }

    //Overall handlebars template needed for generating the configuration
    var template = Handlebars.compile(fs.readFileSync(path.join(__dirname,'config-template.js')).toString())

    //Generate yaml configuration fragments based on downloaded bundle
    //and configuration overrides.
    const generateYamlConfig = (bundle) => {
      var scopeConfig = bundle['configuration'] || {};
      var bundleConfig = bundle['bundleConfiguration'] || {};
      var mergedConfig = mergeConfigs(scopeConfig, bundleConfig);
      var handleBarsConfigTemplate = Handlebars.compile(
        self.io
          .loadSync(bundle['uri'].replace('file://', ''))
          .split('\n')
          .map((l) => {
              return '      ' + l; 
          })
          .join('\n'));
          
      return handleBarsConfigTemplate(mergedConfig);
    }

    var values = {
        deployments: []
    };

    //iterate over each bundle
    //Generate the yaml fragment for the bundle
    //Add generated yaml fragment to the templating data
    config.forEach((bundle) => {
      var scopeId = bundle['scopeId'];
      
      var yamlConfigurationFragment = generateYamlConfig(bundle);
      var scopedConfig = values.deployments.find((config) => {
        return config.scope == scopeId;
      });
      
      if(scopedConfig) {
        scopedConfig.bundles.push(yamlConfigurationFragment);
      } else {
        var scopeObject = {
          scope: scopeId, 
          bundles: [
            yamlConfigurationFragment
          ]
        };
        values.deployments.push(scopeObject)
      }
    });

    

    var templatedConfiguration = template(values);
    return templatedConfiguration;

}

/**
 * read response status
 * @param url
 * @param err
 * @param response
 * @param body
 * @param cb
 * @private
 */
Apid.prototype._processResponse = function (url, response, body, cb) {
    var self = this;
    var failed = false;
    if(response && response.statusCode !== 200) {
        failed = true;
    }

    const level = failed ? 'warning:' : 'info:';
    const responseMessage = response ? (response.statusCode + ' ' + response.statusMessage) : ''; 
    const logMessage = util.format('%s config download from %s returned %s', level, url, responseMessage);
    
    if (response && response.statusCode !== 200) {
        cb(new Error(util.format('%s : %s', response.statusCode, response.statusMessage)));
    } else {
        body = JSON.parse(body);

        var config;
        try {
          config = yaml.safeLoad(this.stitch(body));
        } catch(e) {
          return cb(e)
        }
        
        if (fs.existsSync(process.env.CONFIG_OVERRIDES_PATH)) {
            localConfig = this.io.loadSync(process.env.CONFIG_OVERRIDES_PATH);
            cb(null, formatConfig(applyDefaults(merge(config, localConfig))));
        } else {
            cb(null, formatConfig(applyDefaults(config)));
        }
    }
}
