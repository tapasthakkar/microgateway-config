'use strict';

var io = require('./lib/io');
var network = require('./lib/network');
var path = require('path');
var os = require('os')
const RedisClientLib = require('./lib/redisClient');
const EnvTagsReplacer = require('./lib/env-tags-replacer');

module.exports = function(){
  let envTagsReplacerInstance = new EnvTagsReplacer();
  var ioInstance = io(envTagsReplacerInstance);
  var networkInstance = network(ioInstance, envTagsReplacerInstance);
  return {
    get:function(options,cb){
      /**
       * load the config from the network and merge with default config
       * @param options {target:save location and filename,keys: {key:,secret:},source:default loading target}
       * @param callback function(err){}
       */
      return networkInstance.get(options,cb)
    },
    init:function(options, cb){
      /**
       * initializes the config based on a source config, this must be called first
       * @param options {source,targetDir,targetFile}
       * @param cb function(err,configpath)
       */
      return ioInstance.initConfig(options,cb)
    },
    load:function(options){
      /**
       * loads config from source config, defaults to your home directory if you don't specify a source
       * @param options {source,hash=1,0}
       * @returns {err,config}
       */
      options = options || {}
      options.source = options.source || path.join(os.homedir(), '.edgemicro', 'config.yaml');
      return ioInstance.loadSync(options);
    },
    save:function(config,target){
      /**
       * saves the config
       * @param config to save
       * @param target destination
       */
      return ioInstance.saveSync(config,target)
    },
    setConsoleLogger:function(consoleLogger){
      /**
       * sets the consoleLogger to ioInstance and networkInstance
       * @param consoleLogger to use for console logging
       */
      ioInstance.setConsoleLogger(consoleLogger);
      networkInstance.setConsoleLogger(consoleLogger);
      envTagsReplacerInstance.setConsoleLogger(consoleLogger);
    },
    getRedisClient:function(config, cb){
      /**
       * Returns a new redis connection object.
       * @param config object with redisHost, redisPort, redisDb and retryEnabled
       */
      return new RedisClientLib(config, cb);
    },
    replaceEnvTags:function(config,options){
      /**
       * replaces the env tags in config by the env values
       * @param config object whose <E></E> tags to be replaced with env values.
       * @param options object which has below properties
       * disableLogs: boolean value, if 'true' console errors and debug logs will not be displayed. 
       */
      return envTagsReplacerInstance.replaceEnvTags(config,options)
    }
  };
}();
