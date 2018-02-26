import fs from 'fs';
import send from 'koa-send';
import getAccount from '../accounts';
import nconf from '../config';

const account = getAccount();

const optionsStatic = {
  root: 'dist/web',
};

if (nconf.get('NODE_ENV') === 'production') {
  fs.accessSync(optionsStatic.root);
}

export default async ctx => {
  if (!ctx.state.user.id) {
    ctx.redirect(account.getOAuth2URL());
    return;
  }
  let { path } = ctx;
  if (path === '/') path = '/index.html';
  if (await send(ctx, path, optionsStatic)) return;
  ctx.redirect('/');
};
