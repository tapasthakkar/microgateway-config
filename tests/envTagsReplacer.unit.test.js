'use strict';

const assert = require('assert');
const path = require('path');

const { load } = require('../index.js');
const replaceEnvTags = require('../lib/env-tags-replacer.js');
const fixtureDirectory = path.join(__dirname, 'fixtures');
const defaultOrgEnvFilename = `cached.yaml`;
let customFixtureDirPath = path.join(fixtureDirectory, defaultOrgEnvFilename);
let loadedConfig = load({ source: customFixtureDirPath });


describe('env-tags-replacer module', () => {

    beforeEach((done) => {
        loadedConfig = load({ source: customFixtureDirPath });
        done();
    });

    it('replaces single string env tag', (done) => {
        process.env.UNIT_TESTS_REDIS_HOST = 'localhost';
        loadedConfig.edgemicro.redisHost = "<E>UNIT_TESTS_REDIS_HOST</E>"
        let envReplacedConfig = null;
        try {
            envReplacedConfig = replaceEnvTags(loadedConfig);
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal(envReplacedConfig.edgemicro.redisHost, process.env.UNIT_TESTS_REDIS_HOST);
        done();
    });

    it('replaces multiple env tags', (done) => {
        process.env.UNIT_TESTS_REDIS_HOST = 'localhost';
        process.env.UNIT_TESTS_REDIS_PASSWORD = 'secret123';
        loadedConfig.edgemicro.redisHost = "<E>UNIT_TESTS_REDIS_HOST</E>"
        loadedConfig.edgemicro.redisPassword = "<E>UNIT_TESTS_REDIS_PASSWORD</E>"
        let envReplacedConfig = null;
        try {
            envReplacedConfig = replaceEnvTags(loadedConfig);
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal(envReplacedConfig.edgemicro.redisHost, process.env.UNIT_TESTS_REDIS_HOST);
        assert.equal(envReplacedConfig.edgemicro.redisPassword, process.env.UNIT_TESTS_REDIS_PASSWORD);
        done();
    });

    it('replaces multiple definitions of same env tag', (done) => {
        process.env.UNIT_TESTS_EMG_KEY = 'edgemicro_key';
        process.env.UNIT_TESTS_EMG_SECRET = 'secret123';

        if (loadedConfig.quota) {
            Object.keys(loadedConfig.quota).forEach(function(name) {
                const quota = loadedConfig.quota[name];
                quota.key = "<E>UNIT_TESTS_EMG_KEY</E>";
                quota.secret = "<E>UNIT_TESTS_EMG_SECRET</E>";
            });
        }
        let envReplacedConfig = null;
        try {
            envReplacedConfig = replaceEnvTags(loadedConfig);
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        if (envReplacedConfig.quota) {
            Object.keys(envReplacedConfig.quota).forEach(function(name) {
                const quota = envReplacedConfig.quota[name];
                assert.equal(quota.key, process.env.UNIT_TESTS_EMG_KEY);
                assert.equal(quota.secret, process.env.UNIT_TESTS_EMG_SECRET);
            });
        }
        done();
    });

    it('replaces env tag in array', (done) => {
        process.env.UNIT_TESTS_PLUGIN_SECURITY = 'oauth';
        
        loadedConfig.edgemicro.plugins.sequence[0] = "<E>UNIT_TESTS_PLUGIN_SECURITY</E>"

        let envReplacedConfig = null;
        try {
            envReplacedConfig = replaceEnvTags(loadedConfig);
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal(envReplacedConfig.edgemicro.plugins.sequence[0], process.env.UNIT_TESTS_PLUGIN_SECURITY);
        done();
    });

    it('does not replace only with start env tag', (done) => {
        process.env.UNIT_TESTS_REDIS_HOST = 'localhost';
        loadedConfig.edgemicro.redisHost = "<E>UNIT_TESTS_REDIS_HOST"
        let envReplacedConfig = null;
        try {
            envReplacedConfig = replaceEnvTags(loadedConfig);
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal(envReplacedConfig.edgemicro.redisHost, loadedConfig.edgemicro.redisHost);
        done();
    });

    it('does not replace only with end env tag', (done) => {
        process.env.UNIT_TESTS_REDIS_HOST = 'localhost';
        loadedConfig.edgemicro.redisHost = "UNIT_TESTS_REDIS_HOST</E>"
        let envReplacedConfig = null;
        try {
            envReplacedConfig = replaceEnvTags(loadedConfig);
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal(envReplacedConfig.edgemicro.redisHost, loadedConfig.edgemicro.redisHost);
        done();
    });

    it('does not throw error if env var is not defined', (done) => {
        loadedConfig.edgemicro.redisHost = "<E>UNIT_TESTS_NO_ENV_VAR</E>"
        let envReplacedConfig = null;
        try {
            envReplacedConfig = replaceEnvTags(loadedConfig);
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal(envReplacedConfig.edgemicro.redisHost, loadedConfig.edgemicro.redisHost);
        done();
    });

    it('does not replace with invalid env tag', (done) => {
        process.env.UNIT_TESTS_REDIS_HOST = 'localhost';
        loadedConfig.edgemicro.redisHost = "<Env>UNIT_TESTS_REDIS_HOST</Env>"
        let envReplacedConfig = null;
        try {
            envReplacedConfig = replaceEnvTags(loadedConfig);
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal(envReplacedConfig.edgemicro.redisHost, loadedConfig.edgemicro.redisHost);
        done();
    });

    it('error logs are printed with displayLogs: true', (done) => {
        process.env.UNIT_TESTS_REDIS_HOST = 'localhost';
        loadedConfig.edgemicro.redisHost = "<E>UNIT_TESTS_REDIS_HOS</E>"
        let envReplacedConfig = null;
        let logs = '';
        try {
            var oldWrite = process.stdout.write;
            process.stdout.write = function(chunk, encoding, callback){
                logs += chunk.toString(); // chunk is a String or Buffer
            }
            envReplacedConfig = replaceEnvTags(loadedConfig, { displayLogs: true });
            process.stdout.write = oldWrite;
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal( logs.includes("No env variable UNIT_TESTS_REDIS_HOS available to replace in config") , true)
        done();
    });

    it('error logs are not printed with displayLogs: false', (done) => {
        process.env.UNIT_TESTS_REDIS_HOST = 'localhost';
        loadedConfig.edgemicro.redisHost = "<E>UNIT_TESTS_REDIS_HOS</E>"
        let envReplacedConfig = null;
        let logs = '';
        try {
            var oldWrite = process.stdout.write;
            process.stdout.write = function(chunk, encoding, callback){
                logs += chunk.toString(); // chunk is a String or Buffer
            }
            envReplacedConfig = replaceEnvTags(loadedConfig, { displayLogs: false });
            process.stdout.write = oldWrite;
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal( logs.includes("No env variable UNIT_TESTS_REDIS_HOS available to replace in config") , false)
        done();
    });

    it('uses writeConsoleLog from options', (done) => {
        process.env.UNIT_TESTS_REDIS_HOST = 'localhost';
        loadedConfig.edgemicro.redisHost = "<E>UNIT_TESTS_REDIS_HOS</E>"
        let envReplacedConfig = null;
        let isCustomFunctionUsed = false;
        let writeConsoleLog = () => {
            isCustomFunctionUsed = true;
        }
        try {
            envReplacedConfig = replaceEnvTags(loadedConfig, { displayLogs: true, writeConsoleLog });
        } catch (err) {
            assert.equal(err, null);
        }
        assert.notEqual(envReplacedConfig, null);
        assert.equal( isCustomFunctionUsed, true)
        done();
    });

});
