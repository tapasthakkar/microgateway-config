var redis = require("redis");
const debug_ = require('debug');
const debug = debug_('config:redisClient');


/**
 * connects to redis db and initialize redisClient
 * @param config object which has host, port and db index for redis.
 */
const redisClientConnection = function(config, cb) {
    let host = config.redisHost || '127.0.0.1';
    let port = config.redisPort || 6379;
    let db = config.redisDb || 0;

    let options = {
        retry_strategy: function (options) { // to avoid multiple retry attempts
            return undefined;
        }
    };
  
    if ( config.redisPassword ) {
        options['auth_pass'] = config.redisPassword;
    }
  
    debug('creating redisClient with port: %d, host: %s, db index: %d and options: %j ', port, host,db, options);
    this.redisClient = redis.createClient( port, host, options );
    this.redisClient.select(db);
    this.redisClient.on('error',  err => {
        debug('redisClient on error ', err);
        if ( cb ) {
            cb(err);
            cb = null;
        }
        
    });
    this.redisClient.on('connect',  () => {
        debug('redisClient on connect ');
    });
    this.redisClient.on('ready',   ()=> {
        debug('redisClient on ready ');
        if ( cb ) {
            cb();
            cb = null;
        }
    });
};

redisClientConnection.prototype.disconnect = function(delay){
    //end cleanly
    if ( !this.redisClient.ready ) {
        debug("redis client is not connected");
        return;
    }
    if (!delay || typeof delay !== 'number') {
        debug("disconnecting redis client");
        this.redisClient.quit();
    } else {
        debug("Will disconnect redis client after: %d", delay);
        setTimeout( ()=> {
            debug("disconnecting redis client");
            this.redisClient.quit();
        },1000*delay)
    }
    
}

redisClientConnection.prototype.read = function(key, cb){
    if (!key || !cb) {
        return;
    }

    if ( !this.redisClient.ready ) {
        cb(new Error('Error in connecting to redis'));
        return;
    }
    debug("reading for key: %s", key);
    this.redisClient.get(key, (err, reply) => {
        debug("redis reply for reply: %s", reply);
        if ( reply === null ) {
            err = new Error('No data in redis for key: '+key);
            debug("No data in redis for key: %s", key);
        }
        if (!err) {
            cb(null,reply)  
        } else {
            cb(err);
        }
    });
}

redisClientConnection.prototype.write = function(key, data, cb){
    if (!key || !data) {
        return;
    }
   
    if ( !this.redisClient.ready ) {
        cb(new Error('Error in connecting to redis'));
        return;
    }
    debug("writing for key: %s, data: %s", key, data);
    try {
        this.redisClient.set(key, data);
    }catch(err){
        cb(err);
        return;
    }
    cb()
   
}

module.exports = redisClientConnection;
