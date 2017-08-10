import path from 'path';
import nconf from 'nconf';
import nconfFormat from 'nconf-yaml';

nconf
.file({
  file: 'config.yml',
  format: nconfFormat,
})
.argv()
.env()
.defaults({
  NODE_ENV: 'development',
  HOST: '',
  PORT: 2333,
  TOKEN_KEY: '__wctoken',
  DATABASE: {
    host: 'localhost',
    dialect: 'sqlite',
    storage: path.resolve('data/db.sqlite3'),
  },
});

nconf.required([
  'SECRET_KEY',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
]);
nconf.set('GITHUB_OAUTH2', `https://github.com/login/oauth/authorize?client_id=${nconf.get('GITHUB_CLIENT_ID')}`);

export default nconf;
