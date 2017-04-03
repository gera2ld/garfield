import store from './store';

/* eslint-disable import/prefer-default-export */
export function hasPermission(key, action) {
  const permissions = store.me.permissions || {};
  const values = permissions[key];
  return values && values.includes(action);
}
