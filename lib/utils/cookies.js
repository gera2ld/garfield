function get(ctx, key) {
  const value = ctx.cookies.get(key, {signed: true});
  try {
    return JSON.parse(new Buffer(value, 'base64').toString());
  } catch (e) {
    // ignore invalid data
  }
}

function set(ctx, key, data) {
  const value = new Buffer(JSON.stringify(data)).toString('base64');
  ctx.cookies.set(key, value, {signed: true});
}

function remove(ctx, key) {
  ctx.cookies.set(key, '', {expires: new Date(Date.now() - 24 * 60 * 60 * 1000)});
}

module.exports = {
  get,
  set,
  remove,
};
