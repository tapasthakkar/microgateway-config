'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const defaultValidator = require('../lib/default-validator.js');
const { init, load, get, save } = require('../index.js');
const edgemicroNodeModDir = process.env.mName || path.join(__dirname, '..', '..', 'microgateway');
const locUtilPath = path.join(edgemicroNodeModDir, 'config', 'locations.js');
const loc = require(locUtilPath);
const mgwInitPath = path.join(edgemicroNodeModDir, 'cli', 'lib', 'init.js');
const mgwInit = require(mgwInitPath);
const mgwConfigurePath = path.join(edgemicroNodeModDir, 'cli', 'lib', 'configure.js');
const mgwConfigure = require(mgwConfigurePath)();
const envVars = require('./envVars.js');
const { user: username, password, env, org, tokenId, tokenSecret } = envVars;
const fixtureDirectory = path.join(__dirname, 'fixtures');
const defaultOrgEnvFilename = `${org}-${env}-config.yaml`;
let customFixtureDirPath = path.join(fixtureDirectory, defaultOrgEnvFilename);
let cachedConfigFixturePath = path.join(fixtureDirectory, 'cached.yaml');
let loadConfigFixturePath = path.join(fixtureDirectory, `load-${org}-${env}-config.yaml`);
const loadedConfig = load({ source: loadConfigFixturePath });


describe('default-validator module', () => {
          
            it('validates config', (done) => {
                try {
                    defaultValidator.validate(loadedConfig);
                } catch (err) {
                    assert.equal(err, null);
                }
                done();
            });

            it('throws error for invalid quota timeunit', (done) => {
                const invalidQuotaConfig = Object.assign({}, loadedConfig, { quota: { timeUnit: 'millenia' } })
                try {
                    defaultValidator.validate(invalidQuotaConfig);
                } catch (err) {
                    assert(err instanceof Error);
                    assert(err.message.includes('invalid value for config.quota.timeUnit'));
                }
                done();
            });

            it('throws error for invalid spikearrest buffersize', (done) => {
                const invalidSpikeArrest = Object.assign({}, loadedConfig, { spikearrest: { timeUnit: 'minute', bufferSize: 'over9000' } })
                try {
                    defaultValidator.validate(invalidSpikeArrest);
                } catch (err) {
                    assert(err.message.includes('config.spikearrest.bufferSize is not a number'));
                }
                done();
            });

            it('throws error for invalid port', (done) => {
                const invalidPortConfig = Object.assign({}, loadedConfig, { edgemicro: { port: 'over9000' } })
                try {
                    defaultValidator.validate(invalidPortConfig);
                } catch (err) {
                    assert(err instanceof Error);
                    assert(err.message.includes('invalid value for config.edgemicro.port'));
                }
                done();
            });

            it('throws error for invalid refresh interval', (done) => {
                    const edgeconfigRefreshInterval = Object.assign({}, loadedConfig.edge_config, { retry_interval: 9001, refresh_interval: 9001 })
                    const invalidRefreshInterval = Object.assign({}, loadedConfig, { edge_config: edgeconfigRefreshInterval })
                    try {
                        defaultValidator.validate(invalidRefreshInterval);
                    } catch (err) {
                        assert(err instanceof Error);
                        assert(err.message.includes('config.edge_config.refresh_interval is too small (min 1h)'));
                        done();
                    };
            });
});