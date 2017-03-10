module.exports = {
  proxies: 
   [ { revision: '16',
       proxy_name: 'edgemicro_hello',
       base_path: '/ilikeapis',
       target_name: 'target2',
       url: 'http://mocktarget.apigee.net/',
       PropBUNDLE_LEVEL: 'scope1bundle2prop',
       PropSCOPE_LEVEL: 'scope1prop',
       vhost: 'myvhost2',
       scope: 'ABCDEF' },
     { revision: '15',
       proxy_name: 'edgemicro_whatsup',
       base_path: '/iloveapis',
       target_name: 'default',
       url: 'http://mocktarget.apigee.net/',
       PropBUNDLE_LEVEL: 'scope1bundle1prop',
       PropSCOPE_LEVEL: 'scope1prop',
       vhost: 'myvhost',
       scope: 'ABCDEF' }] 
}