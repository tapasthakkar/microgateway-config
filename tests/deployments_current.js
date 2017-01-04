'use strict'

var assert = require('assert');
var fs = require('fs');
var assert = require('assert');
var path = require('path')
const util = require('util');

describe('library basic functions', function () {
  before((done) => {
    var http = require('http');
    const PORT=9090;
    function handleRequest(request, response){
      console.log(JSON.stringify(require('./configdir/sample_deployments_response.js')));
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
    console.log('Stitched config:\n', util.inspect(stitchedConfig, {depth: null }))
    assert.equal(stitchedConfig, fs.readFileSync(path.join(__dirname, './output-expected')));
    done();
  })

  it('returns the fully unified correct configuration object, including system config', function (done) {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    apidLib.get({systemConfigPath: path.join(__dirname, 'configdir/systemConfig.yaml')}, (err, stitchedConfig) => {
      console.log('Unified config:\n', util.inspect(stitchedConfig, {depth: null }));
      //TODO do some checks here
      done();
    });
  })
});