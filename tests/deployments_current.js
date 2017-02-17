'use strict'

var assert = require('assert');
var fs = require('fs');
var assert = require('assert');
var path = require('path')
const util = require('util');
const PORT=9090;

describe('library basic functions', function () {
  before((done) => {
    var http = require('http');
    function handleRequest(request, response){
      response.end(JSON.stringify(require('./configdir/sample_deployments_response.js')));
    }
    var server = http.createServer(handleRequest);
    server.listen(PORT, function(){
      console.log("Test apid server listening on: http://localhost:%s", PORT);
      done();
    });
  })

  it('stitches together bundles correctly', function (done) {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    const stitchedConfig = apidLib.stitch(require('./configdir/sample_deployments_response.js'));
    assert.equal(stitchedConfig, fs.readFileSync(path.join(__dirname, './output-expected')).toString());
    done();
  })

  it('returns the fully unified correct configuration object, including system config', function (done) {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    apidLib.get({systemConfigPath: path.join(__dirname, 'configdir/systemConfig.yaml'), apidEndpoint: 'http://localhost:'+PORT}, (err, stitchedConfig) => {
      assert.equal(stitchedConfig.proxies.length, 4);
      assert.equal(stitchedConfig.system.port, 8000);
      assert.equal(stitchedConfig.system.vhosts.myvhost.vhost, 'www.myhost.com:9000');
      assert.equal(stitchedConfig.system.vhosts.myvhost.cert, '/path/to/cert');
      done();
    });
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
