'use strict'

var assert = require('assert');
var fs = require('fs');
var assert = require('assert');
var path = require('path')


describe('library basic functions', function () {
  before((done) => {
    var http = require('http');
    const PORT=9090;
    function handleRequest(request, response){
      response.end((require('../config_dir/sample__deployments_response.js')));
    }
    var server = http.createServer(handleRequest);
    server.listen(PORT, function(){
      console.log("Test apid server listening on: http://localhost:%s", PORT);
      done();
    });
  })

  it('assembles a configuration correctly', function (done) {
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    const stitchedConfig = apidLib.stitch(require('./configdir/sample_deployments_response.js'));
    console.log('Stitched config:\n', stitchedConfig)
    assert.equal(stitchedConfig, fs.readFileSync(path.join(__dirname, './output-expected')));
    done();
  })
});