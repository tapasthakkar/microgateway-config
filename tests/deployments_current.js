'use strict'

var assert = require('assert');
var fs = require('fs');
var assert = require('assert');
var path = require('path')
const util = require('util');
const yaml = require('js-yaml');
const PORT=9090;

var server;

function createServer(handler, port, cb) {
  var http = require('http');
  
  server = http.createServer(handler);
  server.listen(port, function(){
    console.log("Test apid server listening on: http://localhost:%s", PORT);
    cb()
  });
}

describe('library basic functions', function () {
  afterEach(() => {
    if(server) {
      server.close();
    }
  })

  it('stitches together bundles correctly', function (done) {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    const stitchedConfig = apidLib.stitch(require('./configdir/sample_deployments_response.js'));
    assert.equal(stitchedConfig, fs.readFileSync(path.join(__dirname, './output-expected')).toString());
    done();
  })

  it('stitches together bundles correctly, and replaces properties like their name', function (done) {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    const stitchedConfig = apidLib.stitch(require('./configdir/sample_url_and_name_replace_deployment.js'));
    assert.equal(stitchedConfig, fs.readFileSync(path.join(__dirname, './replaced-name-and-basepath-expected')).toString());
    done();
  })

  it('Stitching can potentially build yaml that when parsed will throw an error', function (done) {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    try {
      const stitchedConfig = apidLib.stitch(require('./configdir/sample_bad_duplicate_config'));
      yaml.safeLoad(stitchedConfig);
    } catch(e) {
      assert.equal(e.name, 'YAMLException');
      assert.equal(e.reason, 'duplicated mapping key');
      done();
    }
  })

  it('sends back an empty configuration', function (done) {

    function handleRequest(request, response){
      if(request.method == 'GET') {
        response.writeHead(404)
        response.end();
      } 
    }

    createServer(handleRequest, PORT, () => {
      var Apid = require('../lib/apid');
      var apidLib = new Apid();
      apidLib.get({systemConfigPath: path.join(__dirname, 'configdir/systemConfig.yaml'), apidEndpoint: 'http://localhost:'+PORT}, (err, stitchedConfig) => {
        assert.equal(stitchedConfig.proxies.length, 0);
        assert.equal(stitchedConfig.scopes, null);
        done()
      });
    })
  })

  it('returns the fully unified correct configuration object, including system config', function (done) {

    
    function handleRequest(request, response){
      if(request.method == 'GET') {
        response.end(JSON.stringify(require('./configdir/sample_deployments_response.js')));
      } else {

        var buf = [];

        request.on('data', (d)=>{
          buf += d;
        });

        request.on('end', () => {
          var body = JSON.parse(buf.toString());
          assert.equal(body.length, 4);
          body.forEach((status) => {
            assert.equal(status.status, 'SUCCESS');
          })
          response.writeHead(200);
          response.end();
          done();
        })
        
      }
      
    }

    createServer(handleRequest, PORT, () => {
      var Apid = require('../lib/apid');
      var apidLib = new Apid();
      apidLib.get({systemConfigPath: path.join(__dirname, 'configdir/systemConfig.yaml'), apidEndpoint: 'http://localhost:'+PORT}, (err, stitchedConfig) => {
        assert.equal(stitchedConfig.proxies.length, 4);
        assert.equal(stitchedConfig.system.port, 8000);
        assert.equal(stitchedConfig.system.vhosts.myvhost.vhost, 'www.myhost.com:9000');
        assert.equal(stitchedConfig.system.vhosts.myvhost.cert, '/path/to/cert');
      });
    })
  })

  it('calls back with an error if there is an issue with a deployment', function (done) {

    
    function handleRequest(request, response){
      if(request.method == 'GET') {
        response.end(JSON.stringify(require('./configdir/sample_bad_deployments')));
      } else {

        var buf = [];

        request.on('data', (d)=>{
          buf += d;
        });

        request.on('end', () => {
          var body = JSON.parse(buf.toString());
          assert.equal(body.length, 6);
          body.forEach((status) => {
            assert.equal(status.status, 'FAIL');
          })
          response.writeHead(200);
          response.end();
          done();
        })
        
      }
      
    }

    createServer(handleRequest, PORT, () => {
      var Apid = require('../lib/apid');
      var apidLib = new Apid();
      apidLib.get({systemConfigPath: path.join(__dirname, 'configdir/systemConfig.yaml'), apidEndpoint: 'http://localhost:'+PORT}, (err, stitchedConfig) => {
        assert.equal(err.message, 'config does not exist');
      });
    })
  })

  it('calls back with an error if cannot connect to apid endpoint', function (done) {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    apidLib.get({systemConfigPath: path.join(__dirname, 'configdir/systemConfig.yaml'), apidEndpoint: 'http://foo:'+PORT}, (err, stitchedConfig) => {
      assert.equal(err.code, 'ENOTFOUND')
      done();
    });
  })


});


//There are tests conflicts with long polling. Moving to it's own describe.
describe('Long polling', ()=>{

  afterEach(() => {
    if(server) {
      server.close();
    }
  })
   it('returns the fully unified correct configuration object via long polling', function (done) {
    function handleRequest(request, response){
      if(request.method == 'GET') {
        response.end(JSON.stringify(require('./configdir/sample_deployments_response.js')));
      } else {
        var buf = [];

        request.on('data', (d)=>{
          buf += d;
        });

        request.on('end', () => {
          var body = JSON.parse(buf.toString());
          assert.equal(body.length, 4);
          body.forEach((status) => {
            assert.equal(status.status, 'SUCCESS');
          })
          response.writeHead(200);
          response.end();
          done();
        })
        
      }
      
    }

    createServer(handleRequest, PORT, () => {
      var Apid = require('../lib/apid');
      var apidLib = new Apid();
      apidLib.apidEndpoint =  'http://localhost:'+PORT+'/deployments';

      var mockClientSocket = {
        sendMessage: function(message) {
          var config = JSON.parse(process.env.CONFIG);
          assert.equal(config.proxies.length, 4);
          var scopes = Object.keys(config.scopes);
          assert.equal(scopes.length, 2);
          assert.ok(config['analytics-apid'])
        }
      }

      apidLib.beginLongPoll(mockClientSocket, 100)
    })
  })

})

describe('long polling errors', () => {
  afterEach(() => {
    if(server) {
      server.close();
    }
  })

  it('will report only errored deployments', (done) => {
    var port = 9091;
    var count = 0;
    function handleRequest(request, response){
      
      if(request.method == 'GET') {
        if(count == 0) {
          response.end(JSON.stringify(require('./configdir/sample_deployments_response')));
          count++;
        } else if(count == 1) {
          setTimeout(() => {
            response.end(JSON.stringify(require('./configdir/sample_bad_deployments')));
            count++;
          }, 1000)
          
        }
        
        
      } else {
        var buf = [];

        request.on('data', (d)=>{
          buf += d;
        });

        request.on('end', () => {
          var body = JSON.parse(buf.toString());
          if(count == 1) {
            assert.equal(body.length, 4);
            body.forEach((status) => {
              assert.equal(status.status, 'SUCCESS');
            })
          } else {
            assert.equal(body.length, 2);
            body.forEach((status) => {
              assert.equal(status.status, 'FAIL');
            })
            done();
          }
          
          response.writeHead(200);
          response.end();
          
        })
        
      }
      
    }

    createServer(handleRequest, port, () => {
      var Apid = require('../lib/apid');
      var apidLib = new Apid();

      var mockClientSocket = {
        sendMessage: function(message) {
          var config = JSON.parse(process.env.CONFIG);
          assert.equal(config.proxies.length, 4);
          var scopes = Object.keys(config.scopes);
          assert.equal(scopes.length, 2);
          assert.ok(config['analytics-apid'])
        }
      }

      
      apidLib.get({systemConfigPath: path.join(__dirname, 'configdir/systemConfig.yaml'), apidEndpoint: 'http://localhost:'+port}, (err, stitchedConfig) => {
        apidLib.beginLongPoll(mockClientSocket, 100)
      });
    })
  })
})

describe('long polling full replace', () => {
  afterEach(() => {
    if(server) {
      server.close();
    }
  })

  it('will fully replaced deployments', (done) => {
    var port = 9092;
    var count = 0;
    function handleRequest(request, response){
      
      if(request.method == 'GET') {
        if(count == 0) {
          response.end(JSON.stringify(require('./configdir/sample_deployments_response')));
          count++;
        } else if(count == 1) {
          setTimeout(() => {
            response.end(JSON.stringify(require('./configdir/sample_different_deployments')));
            count++;
          }, 250)
          
        }
        
        
      } else {
        var buf = [];

        request.on('data', (d)=>{
          buf += d;
        });

        request.on('end', () => {
          var body = JSON.parse(buf.toString());
          console.log(body);
          if(count == 1) {
            assert.equal(body.length, 4);
            body.forEach((status) => {
              assert.equal(status.status, 'SUCCESS');
            })
          } else {
            assert.equal(body.length, 4);
            body.forEach((status) => {
              assert.equal(status.status, 'SUCCESS');
            })
            done();
          }
          
          response.writeHead(200);
          response.end();
          
        })
        
      }
      
    }

    createServer(handleRequest, port, () => {
      var Apid = require('../lib/apid');
      var apidLib = new Apid();

      var mockClientSocket = {
        sendMessage: function(message) {
          var config = JSON.parse(process.env.CONFIG);
          assert.equal(config.system.port, 8000);
          assert.equal(config.proxies.length, 4);
          var scopes = Object.keys(config.scopes);
          assert.equal(scopes.length, 2);
          assert.ok(config['analytics-apid'])
        }
      }

      
      apidLib.get({systemConfigPath: path.join(__dirname, 'configdir/systemConfig.yaml'), apidEndpoint: 'http://localhost:'+port}, (err, stitchedConfig) => {
        apidLib.beginLongPoll(mockClientSocket, 100)
      });
    })
  })

  it('will validate proxy configurations properly', (done) => {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    var config = require('./configdir/good_proxy_config');
    
    apidLib._basicValidation(config, (err, valid) => {
      assert.equal(valid, true);
      done();
    });

  });

  it('will invalidate proxy configurations properly', (done) => {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    var config = require('./configdir/bad_proxy_config');
    
    apidLib._basicValidation(config, (err, valid, invalidConfig) => {
      assert.equal(invalidConfig.base_path, '/iloveapis')
      assert.equal(invalidConfig.vhost, 'myvhost')
      assert.equal(valid, false);
      done();
    });

  });
})