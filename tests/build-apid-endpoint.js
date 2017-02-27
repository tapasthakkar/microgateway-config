const assert = require('assert');
const buildApidEndpoint = require('../lib/build-apid-endpoint');

describe('building apid endpoint', ()=>{
  it('will properly build the apid endpoint', ()=>{
    const endpoint = buildApidEndpoint('http://localhost:9090', '/deployments');
    assert.equal(endpoint, 'http://localhost:9090/deployments');
  });

  it('will not care about trailing slashes', ()=>{
    const endpoint = buildApidEndpoint('http://localhost:9090/', '/deployments');
    assert.equal(endpoint, 'http://localhost:9090/deployments');
  });
})