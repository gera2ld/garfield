const fs = require('fs');
const path = require('path');
const send = require('koa-send');

const optionsStatic = {
  root: path.resolve('dist'),
};

fs.accessSync(optionsStatic.root);

module.exports = function* (next) {
  let {path} = this;
  if (path === '/') path = '/index.html';
  if (yield send(this, path, optionsStatic)) return;
  this.status = 302;
  this.set('Location', '/');
};
