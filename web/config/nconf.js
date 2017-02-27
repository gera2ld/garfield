const nconf = require('nconf');

nconf
.file({
  file: 'config.yml',
  format: require('nconf-yaml'),
})
.argv()
.env()
.defaults({
  NODE_ENV: 'development',
  HOST: '',
  PORT: 8080,
  TOKEN_KEY: '__wctoken',
  BACKEND: 'http://localhost:2333',
});

module.exports = nconf;
