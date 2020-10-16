'use strict';

const debug = require('debug')('config:env-tags-replacer');
const CONSOLE_LOG_TAG_COMP = 'microgateway-config env-tags-replacer'

const defaultWriteConsoleLog = function (level, ...data) {
  if (console[level]) {
    console[level](...data);
  }
};

module.exports = function replaceEnvTags(config, options={ }){
  let writeConsoleLog = defaultWriteConsoleLog;
  if ( options.writeConsoleLog ) {
      writeConsoleLog = options.writeConsoleLog
  }
  try {
    let configStr = JSON.stringify(config);
    let envRegx = RegExp('<E>.+?<\/E>','g');
    let envKeys = configStr.match(envRegx);
    if ( envKeys && envKeys.length > 0) {
      envKeys.forEach( key => {
        let envKey = key.replace('<E>','').replace('</E>',''); // remove env tags
        let value = process.env[envKey];
        if ( value ) {
          if ( options.displayLogs ) {
            debug('Replacing: %s by env value: %s', key, `${value}`);
          }
          configStr = configStr.replace(key,`${value}`)
        } else {
          if ( options.displayLogs ) {
            let err = new Error('No env variable '+ envKey +' available to replace in config');
            writeConsoleLog('log',{component: CONSOLE_LOG_TAG_COMP}, err);
          }
        }
      })
      config = JSON.parse(configStr);
    }
  } catch(err) {
    if ( options.displayLogs ) {
      writeConsoleLog('log',{component: CONSOLE_LOG_TAG_COMP},'Error in replacing env tags in the config', err)
    }
  }
  return config;
}