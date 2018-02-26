import axios from 'axios';
import nconf from '../config';

export const key = 'github';

const account = nconf.get(nconf.get('ACCOUNT'));

export async function getUserInfo(code) {
  let res = await fetchToken(code);
  const { access_token: token } = res.data;
  res = await fetchAPI(token, '/user');
  return res;
}

function fetchToken(code) {
  const data = {
    client_id: account.CLIENT_ID,
    client_secret: account.CLIENT_SECRET,
    code,
  };
  return axios.post('https://github.com/login/oauth/access_token', data, {
    headers: {
      Accept: 'application/json',
    },
    responseType: 'json',
  });
}

function fetchAPI(token, path) {
  return axios.get(`https://api.github.com${path}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/json',
    },
    responseType: 'json',
  });
}

export function getOAuth2URL() {
  return `https://github.com/login/oauth/authorize?client_id=${account.CLIENT_ID}`;
}
