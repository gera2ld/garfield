export const object = {
  get(obj, keys) {
    if (typeof keys === 'string') keys = keys.split('.');
    return keys.reduce((res, key) => res && res[key], obj);
  },
  set(obj, keys, value) {
    if (typeof keys === 'string') keys = keys.split('.');
    obj = obj || {};
    const parentKeys = [...keys];
    const lastKey = parentKeys.pop();
    const parent = parentKeys.reduce((res, key) => {
      let node = res[key];
      if (!node) {
        node = {};
        res[key] = node;
      }
      return node;
    }, obj);
    parent[lastKey] = value;
    return obj;
  },
};
