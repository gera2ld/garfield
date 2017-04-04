const fs = require('fs');
const send = require('koa-send');
const config = require('../config');
const OAUTH2 = config.get('GITHUB_OAUTH2');

const optionsStatic = {
  root: 'web/dist',
};

if (config.get('NODE_ENV') === 'production') {
  fs.accessSync(optionsStatic.root);
}

module.exports = async function (ctx, next) {
  if (!ctx.state.user.id) {
    ctx.redirect(OAUTH2);
    return;
  }
  let {path} = ctx;
  if (path === '/') path = '/index.html';
  if (await send(ctx, path, optionsStatic)) return;
  ctx.redirect('/');
};
