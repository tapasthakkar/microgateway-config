const path = require('path');
const assert = require('assert');
const { load } = require('../index.js');
const fixtureDefaultConfig = path.join(__dirname, 'fixtures', 'default.yaml');
const fixtureCachedConfig = path.join(__dirname, 'fixtures', 'cached.yaml');
const fixtureDefaultConfigMaxConnections = 9001;
const fixtureCachedConfigPollInterval = 24;

describe('load', () => {
    it('loads config file from custom directory', done => {
        let loadedConfig = load({ source: fixtureDefaultConfig });
        assert.deepStrictEqual(loadedConfig.edgemicro.max_connections, fixtureDefaultConfigMaxConnections);
        done();
    });

     it('loads cached file from custom directory', done => {
        let cachedConfig = load({ source: fixtureCachedConfig });
        assert.deepStrictEqual(cachedConfig.edgemicro.config_change_poll_interval, fixtureCachedConfigPollInterval);
        done();
    });

})