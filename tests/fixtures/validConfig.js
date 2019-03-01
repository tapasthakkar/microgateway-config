'use strict';

module.exports  = `{
	apiProxies: [
		{
			apiProxyName: 'edgemicro_helloecho',
			revision: '1',
			proxyEndpoint: { name: 'default', basePath: '/helloecho' },
			targetEndpoint: { name: 'default', url: 'https://victorshaw-eval-test.apigee.net/v0/hello/echo' }
		},
		{
			apiProxyName: 'edgemicro_node01',
			revision: '1',
			proxyEndpoint: { name: 'default', basePath: '/node01' },
			targetEndpoint: { name: 'default', url: 'http://10.138.140.138:3000' }
		},
		{
			apiProxyName: 'edgemicro_hello',
			revision: '1',
			proxyEndpoint: { name: 'default', basePath: '/hello' },
			targetEndpoint: { name: 'default', url: 'https://victorshaw-eval-test.apigee.net/v0/hello' }
		}
	]
}`;

