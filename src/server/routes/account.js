import Router from 'koa-router';
import nconf from '../config';
import models from '../models';
import { cookies, getLogger } from '../utils';
import getAccount from '../accounts';

const TOKEN_KEY = nconf.get('TOKEN_KEY');
const account = getAccount();
const logger = getLogger('account');

const router = new Router({
  prefix: '/account',
})
.get('/callback', async ctx => {
  const { code } = ctx.query;
  if (!code) {
    ctx.status = 400;
    return;
  }
  let res;
  try {
    res = await account.getUserInfo(code);
  } catch (err) {
    logger.error(`log in error: ${err}`);
    console.error(err.response);
    ctx.status = 401;
    ctx.body = 'Authentication failed!';
    return;
  }
  const {
    name, id, avatar_url: avatar, email, login,
  } = res.data;
  const userAttr = {
    openId: `${account.key}/${id}`,
    login,
    name,
    email,
    avatar,
  };
  await models.User.upsert(userAttr);
  const user = await models.User.findOne({
    where: { openId: userAttr.openId },
  });
  cookies.set(ctx, TOKEN_KEY, {
    id: user.id,
    name: user.name,
  });
  ctx.redirect('../');
})
.get('/logout', ctx => {
  cookies.remove(ctx, TOKEN_KEY);
  ctx.redirect('../');
});

export default router.routes();
