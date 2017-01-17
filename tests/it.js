'use strict'
var assert = require('assert');
var configlib = require('../index');
var proxyquire = require('proxyquire');
var mockRequest = require('./mock-request');

var target = './tests/configdir/new-config.yaml';
var getPath = '';

var configlibmock = proxyquire.load('../index.js', {
  './lib/network': proxyquire.load('../lib/network', {
    'request': mockRequest
  })
});

describe('library basic functions', function () {
  it('loads from disk', function (done) {
    var config = configlib.load({source:'./tests/config.yaml'});
    var date = Date.now()
    config.now = date;
    configlib.save(config,target)
    config = configlib.load({source:target});
    assert(config.now === date,'dates dont match');
    done();
  });
  it('init from server', function (done) {
    configlib.init({source:'./tests/config.yaml',targetDir:'./tests/configdir/',targetFile:"new-config.yaml"},
      function (err,t2) {
        assert(!err,err)
        assert(t2.indexOf('configdir/new-config.yaml')>=0,'didnt contain path')
        getPath = t2;
        done()
      });
  });
  it('index loads from server', function (done) {
    var keys = {
      key: process.env.EDGEMICRO_KEY || 'mYt3sTk3Y',
      secret: process.env.EDGEMICRO_SECRET || 'mYt3sTs3Cr3T'
    }
    if(process.env.EDGEMICRO_KEY && process.env.EDGEMICRO_SECRET) {
      configlib.get({source:'./tests/configdir/my-config.yaml',target:getPath,keys:keys}, function (err,config) {
        assert(config, 'does not have config')
        done();
      });
    } else {
      configlibmock.get({source:'./tests/configdir/test-config.yaml',target:getPath,keys:keys}, function (err,config) {
        assert(config, 'does not have config')
        done();
      });
    }
  });
  it('filters proxies and products', function (done) {
    var keys = {
      key: 'mYt3sTk3Y',
      secret: 'mYt3sTs3Cr3T'
    }
    configlibmock.get({source:'./tests/configdir/test-config.yaml',target:getPath,keys:keys}, function (err,config) {
      assert(config, 'does not have config');
      assert.equal(config.proxies[0].name, 'edgemicro_proxyOne', 'proxy not as expected');
      assert.equal(config.proxies[1].name, 'edgemicro_proxyTwo', 'proxy not as expected');
      assert.deepEqual(config.product_to_proxy, {
        productOne: [ 'edgemicro_proxyOne', 'edgemicro_proxyTwo' ],
        productTwo: [ 'edgemicro_proxyOne', 'edgemicro_proxyThree' ]
      }, 'products not as expected');
      done();
    });
  });
});
