import axios from 'axios';
import nconf from '../config';

export const key = 'gitee';

const account = nconf.get(nconf.get('ACCOUNT'));

export async function getUserInfo(code) {
  let res = await fetchToken(code);
  const { access_token: token } = res.data;
  res = await fetchAPI(token, '/v5/user');
  return res;
}

function fetchToken(code) {
  const data = {
    client_id: account.CLIENT_ID,
    client_secret: account.CLIENT_SECRET,
    redirect_uri: account.REDIRECT_URI,
    grant_type: 'authorization_code',
    code,
  };
  return axios.post('https://gitee.com/oauth/token', data, {
    headers: {
      Accept: 'application/json',
    },
    responseType: 'json',
  });
}

function fetchAPI(token, path) {
  return axios.get(`https://gitee.com/api${path}?access_token=${token}`, {
    headers: {
      Accept: 'application/json',
    },
    responseType: 'json',
  });
}

export function getOAuth2URL() {
  return `https://gitee.com/oauth/authorize?client_id=${account.CLIENT_ID}&redirect_uri=${encodeURIComponent(account.REDIRECT_URI)}&response_type=code`;
}
