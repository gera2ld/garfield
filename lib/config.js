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
  TOKEN_KEY: '__wctoken',
  DATABASE: {
    host: 'localhost',
    dialect: 'sqlite',
    storage: 'data/db.sqlite3',
  },
});

nconf.required([
  'SECRET_KEY',
  'GITHUB_CLIENT_ID',
]);
nconf.set('GITHUB_OAUTH2', `https://github.com/login/oauth/authorize?client_id=${nconf.get('GITHUB_CLIENT_ID')}`);

module.exports = nconf;
