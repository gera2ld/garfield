const fs = require('fs');
const send = require('koa-send');
const config = require('../config');
const OAUTH2 = config.get('GITHUB_OAUTH2');

const optionsStatic = {
  root: config.get('STATIC_DIR'),
};

if (config.get('NODE_ENV') === 'production') {
  fs.accessSync(optionsStatic.root);
}

module.exports = async function (next) {
  if (!this.state.user.id) {
    this.redirect(OAUTH2);
    return;
  }
  let {path} = this;
  if (path === '/') path = '/index.html';
  if (await send(this, path, optionsStatic)) return;
  this.redirect('/');
};
