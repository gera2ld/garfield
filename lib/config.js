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
  TOKEN_KEY: '__wctoken',
});

nconf.required([
  'GITHUB_CLIENT_ID',
]);
nconf.set('GITHUB_OAUTH2', `https://github.com/login/oauth/authorize?client_id=${nconf.get('GITHUB_CLIENT_ID')}`);
nconf.set('BACKEND', nconf.get('BACKEND') || `http://localhost:${nconf.get('PORT')}`);

module.exports = nconf;