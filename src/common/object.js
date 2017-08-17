function normalizeKeys(key) {
  if (key == null) return [];
  if (Array.isArray(key)) return key;
  return `${key}`.split('.').filter(Boolean);
}

export function objectGet(obj, rawKey, def) {
  const keys = normalizeKeys(rawKey);
  let res = obj;
  keys.every(key => {
    if (res && typeof res === 'object' && (key in res)) {
      res = res[key];
      return true;
    }
    res = def;
    return false;
  });
  return res;
}

export function objectSet(obj, rawKey, val) {
  const keys = normalizeKeys(rawKey);
  if (!keys.length) return val;
  const root = obj || {};
  let sub = root;
  const lastKey = keys.pop();
  keys.forEach(key => {
    let child = sub[key];
    if (!child) {
      child = {};
      sub[key] = child;
    }
    sub = child;
  });
  if (typeof val === 'undefined') {
    delete sub[lastKey];
  } else {
    sub[lastKey] = val;
  }
  return root;
}
