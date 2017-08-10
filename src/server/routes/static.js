import fs from 'fs';
import send from 'koa-send';
import nconf from '../config';

const OAUTH2 = nconf.get('GITHUB_OAUTH2');

const optionsStatic = {
  root: 'dist/web',
};

if (nconf.get('NODE_ENV') === 'production') {
  fs.accessSync(optionsStatic.root);
}

export default async ctx => {
  if (!ctx.state.user.id) {
    ctx.redirect(OAUTH2);
    return;
  }
  let { path } = ctx;
  if (path === '/') path = '/index.html';
  if (await send(ctx, path, optionsStatic)) return;
  ctx.redirect('/');
};
