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
  DATA_DIR: 'data',
  HOST: '',
  PORT: 2333,
  DEV_PORT: 8080,   // used in dev-server
})

module.exports = nconf;
