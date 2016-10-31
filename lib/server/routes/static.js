const path = require('path');
const send = require('koa-send');

const optionsStatic = {
  root: path.resolve('lib/app'),
};

module.exports = function* (next) {
  let {path} = this;
  if (path === '/') path = '/index.html';
  if (yield send(this, path, optionsStatic)) return;
  this.status = 302;
  this.set('Location', '/');
};
