const url = require('url');

module.exports = (endpoint, path) => {
  var parsedUrl = url.parse(endpoint);
  parsedUrl.pathname = path;
  return url.format(parsedUrl);
}