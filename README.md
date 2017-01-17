#apigee microgateway config module

this module takes a source config yaml and and returns a merged config from the network
inorder to use its recommended you work in this order

1. call the init function which will copy a source example and save to a target location
2. call get to refresh the gateway data into the config, can be called after init
3. call save to save any changes
4. call load to load an existing config from disk

api looks like this
```javascript
{
    get:function(options,cb){
      /**
       * load the config from the network and merge with default config
       * @param options {target:save location and filename,keys: {key:,secret:},source:default loading target}
       * @param callback function(err){}
       */

    },
    init:function(options, cb){
      /**
       * initializes the config based on a source config, this must be called first
       * @param options {source,targetDir,targetFile}
       * @param cb function(err,configpath)
       */

    },
    load:function(options){
      /**
       * loads config from source config, defaults to your home directory if you don't specify a source
       * @param options {source,hash=1,0}
       * @returns {err,config}
       */
    },
    save:function(config,target){
      /**
       * saves the config
       * @param config to save
       * @param target destination
       */

    }
  };
  ```

## testing
while the entire test suite for this project can be tested without any external dependencies, you may want to run tests using your own microgateway configuration. Here's an example of how to do this:

```sh
cp /path/to/your/config.yaml ./tests/configdir/my-config.yaml
EDGEMICRO_KEY=< your edgemicro key >
EDGEMICRO_SECRET=< your edgemicro secret >
npm test
```
