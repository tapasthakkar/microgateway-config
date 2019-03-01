//to test fill in tests/envVars.js with account info
// set edgemicroNodeModDir to the location of microgateway

'use strict';
const envVars = require('./envVars.js');
const path = require('path');
const edgemicroNodeModDir = process.env.mName || path.join(__dirname, '..', '..', 'microgateway');
const fs = require('fs');
const assert = require('assert');
const os = require('os');
const jsyaml = require('js-yaml');
const locUtilPath = path.join(edgemicroNodeModDir, 'config', 'locations.js');
const loc = require(locUtilPath);
const mgwInitPath = path.join(edgemicroNodeModDir, 'cli', 'lib', 'init.js');
const mgwInit = require(mgwInitPath);
const mgwConfigurePath = path.join(edgemicroNodeModDir, 'cli', 'lib', 'configure.js');
const mgwStartPath = path.join(edgemicroNodeModDir, 'cli', 'lib', 'start.js');
const mgwReloadPath = path.join(edgemicroNodeModDir, 'cli', 'lib', 'reload-cluster.js');
const mgwStopPath = path.join(edgemicroNodeModDir, 'cli', 'lib', 'stop.js');
const mgwConfigure = require(mgwConfigurePath)();
const { init, load, get, save } = require('../index.js');
const fixtureDirectory = path.join(__dirname, 'fixtures');
const defaultSource = path.join(os.homedir(), '.edgemicro', 'default.yaml');
const defaultConfigString = fs.readFileSync(defaultSource, 'utf8');
const defaultConfigJSON = jsyaml.safeLoad(defaultConfigString, 'utf8');
const mergedDefaultConfigSource = path.join(__dirname, './fixtures/victorshaw-eval-test-config.yaml');
const mergedConfigTarget = path.join(__dirname, './fixtures/testing-victorshaw-eval-test-config.yaml');

const { user: username, password, env, org, key, secret, tokenId, tokenSecret } = envVars;
const defaultPath = loc.getDefaultPath();
const defaultDir = loc.homeDir;
const defaultOrgEnvFilename = `${org}-${env}-config.yaml`;
const defaultConfigFilePath = path.join(defaultDir, defaultOrgEnvFilename);
const customFilename = 'customFilename.yaml';
const defaultDirCustomFilename = path.join(defaultDir, customFilename);
let customFixtureDirPath = path.join(fixtureDirectory, defaultOrgEnvFilename);
let customFixtureDirFilePath = path.join(fixtureDirectory, customFilename);
const invalidProductURL = path.join(__dirname, './fixtures/invalidJSONProducts.yaml');

const http = require('http');
const invalidConfig = require(path.join(__dirname, './fixtures/invalidConfig.js'));
const validConfig = require(path.join(__dirname, './fixtures/validConfig.js'));
let apigeetool = require('apigeetool');
let asdfFilePath = path.join(fixtureDirectory, 'asdf.yaml');
let initErr;
let copiedFilePath;
let mergedConfig;
let prods;

let sdk = apigeetool.getPromiseSDK();
let opts = {
    organization: org,
    username,
    password,
    environment: env,
    mapName: 'microgateway',
    api: 'edgemicro_auth'
};

let newProd = Object.assign({}, opts, {
    productName: 'EdgeMicroJSON2',
    productDesc: 'EdgeMicroJSON2',
    proxies: 'edgemicro-auth,edgemicro_hello',
    environments: 'test'
});
let errProd = Object.assign({}, opts, {
    productName: 'EdgeMicroPOISON2',
    productDesc: 'EdgeMicroP"OISON2',
    scopes: '"x,,',
    proxies: 'edgemicro-auth,edgemicro_hello',
    environments: 'test'
});



describe('microgateway-config index module', () => {
            after(done => {
                if (fs.existsSync(customFixtureDirPath)) fs.unlinkSync(customFixtureDirPath);
                if (fs.existsSync(customFixtureDirFilePath)) fs.unlinkSync(customFixtureDirFilePath);
                if (fs.existsSync(defaultDirCustomFilename)) fs.unlinkSync(defaultDirCustomFilename);
                done();
            });

            describe('load', () => {
                before((done) => {
                    if (fs.existsSync(defaultPath)) fs.unlinkSync(defaultPath);
                    mgwInit({}, (err, result) => {
                        assert.equal(null, err);
                        done();
                    });
                });

                it('loads default config file from default directory', done => {
                    let loadedConfig = load({ source: loc.getDefaultPath() });
                    let defaultConfigJSON = jsyaml.safeLoad(fs.readFileSync(loc.getDefaultPath()));
                    Object.keys(loadedConfig).forEach(k => {
                        if (k !== '_hash') assert.deepStrictEqual(defaultConfigJSON[k], loadedConfig[k]);
                    });
                    done();
                });

                it('loads default config file from custom directory', done => {
                    console.log('loc.getDefaultPath(fixtureDirectory)', loc.getDefaultPath(fixtureDirectory));
                    let loadedConfig = load({ source: loc.getDefaultPath(fixtureDirectory) });
                    assert.deepStrictEqual(loadedConfig.edgemicro.max_connections, 9001);
                    done();
                });
            });

            describe('init', () => {

                before((done) => {
                    if (fs.existsSync(customFixtureDirPath)) fs.unlinkSync(customFixtureDirPath);
                    if (fs.existsSync(customFixtureDirFilePath)) fs.unlinkSync(customFixtureDirFilePath);
                    if (fs.existsSync(defaultDirCustomFilename)) fs.unlinkSync(defaultDirCustomFilename);
                    done();
                });
                after(done => {
                    if (fs.existsSync(customFixtureDirPath)) fs.unlinkSync(customFixtureDirPath);
                    if (fs.existsSync(customFixtureDirFilePath)) fs.unlinkSync(customFixtureDirFilePath);
                    if (fs.existsSync(defaultDirCustomFilename)) fs.unlinkSync(defaultDirCustomFilename);
                    done();
                });

                it('initializes env-org source config to custom directory', done => {
                    init({
                        source: defaultPath,
                        targetDir: fixtureDirectory,
                        targetFile: loc.getSourceFile(org, env),
                        overwrite: true
                    }, (err, configPath) => {
                        assert.equal(null, err);
                        assert.deepStrictEqual(customFixtureDirPath, configPath);
                        done();
                    });
                });

                it('initializes env-org source config to custom filename in default directory', done => {
                    init({
                            source: defaultPath,
                            targetDir: loc.homeDir,
                            targetFile: customFilename,
                            overwrite: true
                        },
                        (err, configPath) => {
                            assert.equal(null, err);
                            assert.deepStrictEqual(defaultDirCustomFilename, configPath);
                            done();
                        });
                });

                it('initializes env-org source config to custom filename in custom directory', done => {
                    init({
                            source: defaultPath,
                            targetDir: fixtureDirectory,
                            targetFile: customFilename,
                            overwrite: true
                        },
                        (err, configPath) => {
                            assert.equal(null, err);
                            assert.deepStrictEqual(customFixtureDirFilePath, configPath);
                            done();
                        }
                    );
                });
            });

            describe('save', () => {
                let configOpts = { env, org, username, password, configDir: fixtureDirectory };
                before(done => {
                    mgwConfigure.configure(configOpts, (err) => {
                        assert.equal(err, null);
                        assert.equal(true, fs.existsSync(customFixtureDirPath));
                        done();
                    });
                });
                after(done => {
                    // if (fs.existsSync(asdfFilePath)) fs.unlinkSync(asdfFilePath);
                    done();
                });
                it('saves config', done => {
                    let loadedConfig = load({ source: customFixtureDirPath });
                    try {
                        save(loadedConfig, asdfFilePath);
                    } catch (err) {
                        console.error(err);
                        assert.equal(err, null);
                    }
                    let asdfJSON = jsyaml.safeLoad(fs.readFileSync(asdfFilePath, 'utf8'));
                    assert.deepStrictEqual(asdfJSON.edgemicro.max_connections, 9001);
                    done();
                });
            });

            describe('get', (done) => {
                before((done) => {
                    get({ source: asdfFilePath, keys: { key, secret } },
                        (err, config) => {
                            assert.equal(err, null);
                            if (!config.product_to_proxy['EdgeMicroJSON2']) {
                                sdk.createProduct(newProd)
                                    .then(result => done())
                                    .catch(err => console.error(err));
                            }
                        });
                });
                after(done => {
                    sdk.deleteProduct(newProd)
                        .then(result => done())
                        .catch(err => console.error(err));
                });
                it('gets product updates from server', done => {
                    get({
                        source: asdfFilePath,
                        keys: { key, secret }
                    }, (err, config) => {
                        assert.equal(err, null);
                        prods = config;
                        assert(typeof config.product_to_proxy['EdgeMicroJSON2'] !== 'undefined');
                        done();
                    });
                });
            });



            describe('error actions - products from server', (done) => {
                before(done => {
                    get({
                        source: asdfFilePath,
                        keys: { key, secret }
                    }, (err, config) => {
                        assert.equal(err, null);
                        assert(config.product_to_proxy && !config.product_to_proxy['EdgeMicroPOISON2']);
                        sdk.createProduct(errProd)
                            .then(result => setTimeout(done, 5000))
                            .catch(err => console.error(err));
                    });
                });

                after(done => {
                    sdk.deleteProduct(errProd)
                        .then(result => done())
                        .catch(err => console.error(err));
                });

                it('throw error when receiving updates which are not valid JSON', done => {
                    get({
                        source: asdfFilePath,
                        keys: { key, secret }
                    }, (err, config) => {
                        assert.notEqual(err, null);
                        done();
                    });
                });
            });
});