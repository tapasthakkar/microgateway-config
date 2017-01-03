'use strict'
var assert = require('assert');
var configlib = require('../index');
var fs = require('fs');

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
    //const config = configlib().get();
    //console.log("Recieved config object: ", config);
    var Apid = require('../lib/apid');
    var apidLib = new Apid();
    fs.writeFileSync('output-test', apidLib.stitch(require('./configdir/sample_deployments_response.js')));
    done();
  })
});