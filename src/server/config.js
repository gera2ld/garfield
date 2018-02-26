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
  GITHUB: {
    CLIENT_ID: null,
    CLIENT_SECRET: null,
  },
  GITEE: {
    CLIENT_ID: null,
    CLIENT_SECRET: null,
    REDIRECT_URI: null,
  },
});

nconf.required([
  'SECRET_KEY',
  'ACCOUNT',
]);

export default nconf;
