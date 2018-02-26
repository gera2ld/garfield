import nconf from '../config';
import * as oauth2Github from './github';
import * as oauth2Gitee from './gitee';

export default function getAccount(key) {
  return {
    GITHUB: oauth2Github,
    GITEE: oauth2Gitee,
  }[key || nconf.get('ACCOUNT')];
}
