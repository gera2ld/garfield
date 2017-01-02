const fetch = require('node-fetch');
const Router = require('koa-router');
const utils = require('../../utils');
const config = require('../../config');
const models = require('../../models');
const TOKEN_KEY = config.get('TOKEN_KEY');
const CLIENT_ID = config.get('GITHUB_CLIENT_ID');
const CLIENT_SECRET = config.get('GITHUB_CLIENT_SECRET');

function parseJSON(res) {
  return res.json()
  .then(data => res.ok ? {data} : {status: res.status, error: data});
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
.get('/callback', function* (next) {
  const {code} = this.query;
  if (!code) {
    this.status = 400;
    return;
  }
  let res = yield fetchToken(code);
  if (res.data) {
    const {access_token: token} = res.data;
    res = yield fetchAPI(token, '/user');
  }
  if (res.error) {
    this.status = res.status;
    this.body = res.error;
    return;
  }
  const {name, id, avatar_url, email, login} = res.data;
  const userAttr = {
    openId: `github/${id}`,
    login,
    name,
    email,
    avatar: avatar_url,
  };
  let user = yield models.User.findOne({
    where: {
      openId: userAttr.openId
    },
  });
  // Error ocurs if several users log in with the same account at the same time
  if (user) {
    Object.assign(user, userAttr);
    yield user.save();
  } else {
    userAttr.permission = JSON.stringify({
      project: ['show'],
    });
    user = yield models.User.create(userAttr);
  }
  utils.cookies.set(this, TOKEN_KEY, {
    id: user.id,
    name: user.name,
  });
  this.redirect('../');
})
.get('/logout', function* (next) {
  utils.cookies.remove(this, TOKEN_KEY);
})

module.exports = router.routes();
