'use strict'
var assert = require('assert');
var configlib = require('../index');

var target = './tests/configdir/new-config.yaml';
var getPath = '';

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
      key: "ae686bcfe929f2392c8e13dffa3b46b815216fe64ac1b43e2868b3f74878c2a1",
      secret: "4ee8bc8463729df390e60587748a67b33b84d309143438aa98dcf4f259f38832"
    }
    configlib.get({source:'./tests/config.yaml',target:getPath,keys:keys}, function (err,config) {
      assert(config, 'does not have config')
      done();
    });
  });
});