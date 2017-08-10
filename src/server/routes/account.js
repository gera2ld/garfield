import fetch from 'node-fetch';
import Router from 'koa-router';
import { cookies } from '../utils';
import nconf from '../config';
import models from '../models';

const TOKEN_KEY = nconf.get('TOKEN_KEY');
const CLIENT_ID = nconf.get('GITHUB_CLIENT_ID');
const CLIENT_SECRET = nconf.get('GITHUB_CLIENT_SECRET');

function parseJSON(res) {
  return res.json()
  .then(data => (res.ok ? { data } : { status: res.status, error: data }));
}

function fetchToken(code) {
  const data = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
  };
  return fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(parseJSON);
}

function fetchAPI(token, path) {
  return fetch(`https://api.github.com${path}`, {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/json',
    },
  })
  .then(parseJSON);
}

const router = new Router({
  prefix: '/account',
})
.get('/callback', async ctx => {
  const { code } = ctx.query;
  if (!code) {
    ctx.status = 400;
    return;
  }
  let res = await fetchToken(code);
  if (res.data) {
    const { access_token: token } = res.data;
    res = await fetchAPI(token, '/user');
  }
  if (res.error) {
    ctx.status = res.status;
    ctx.body = res.error;
    return;
  }
  const { name, id, avatar_url, email, login } = res.data;
  const userAttr = {
    openId: `github/${id}`,
    login,
    name,
    email,
    avatar: avatar_url,
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
