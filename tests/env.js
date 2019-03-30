const assert = require('assert');

const password = process.env.MOCHA_PASSWORD;
const key = process.env.MOCHA_KEY;
const secret = process.env.MOCHA_SECRET;
const user = process.env.MOCHA_USER;
const org = process.env.MOCHA_ORG;
const env = process.env.MOCHA_ENV;
const tokenSecret = process.env.MOCHA_TOKEN_SECRET;
const tokenId = process.env.MOCHA_TOKEN_ID;

assert(password, 'Must set environment variable MOCHA_PASSWORD');
assert(user, 'Must set environment variable MOCHA_USER');
assert(org, 'Must set environment variable MOCHA_ORG');
assert(env, 'Must set environment variable MOCHA_ENV');
assert(key, 'Must set environment variable MOCHA_KEY');
assert(secret, 'Must set environment variable MOCHA_SECRET');
assert(tokenId, 'Must set environment variable MOCHA_TOKEN_ID');
assert(tokenSecret, 'Must set environment variable MOCHA_TOKEN_SECRET');

module.exports = {
  password,
  key,
  secret,
  user,
  org,
  env,
  tokenSecret,
  tokenId
};
