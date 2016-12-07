const fs = require('fs');
const path = require('path');
const send = require('koa-send');
const config = require('../../config');

const optionsStatic = {
  root: path.resolve(__dirname, '../../../dist'),
};

if (config.get('NODE_ENV') === 'production') {
  fs.accessSync(optionsStatic.root);
}

module.exports = function* (next) {
  let {path} = this;
  if (path === '/') path = '/index.html';
  if (yield send(this, path, optionsStatic)) return;
  this.status = 302;
  this.set('Location', '/');
};
