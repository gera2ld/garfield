export function get(ctx, key) {
  const value = ctx.cookies.get(key, { signed: true });
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString());
  } catch (e) {
    // ignore invalid data
  }
}

export function set(ctx, key, data) {
  const value = Buffer.from(JSON.stringify(data)).toString('base64');
  ctx.cookies.set(key, value, { signed: true });
}

export function remove(ctx, key) {
  ctx.cookies.set(key, '', { expires: new Date(Date.now() - 24 * 60 * 60 * 1000) });
}
