import winston from 'winston';
export * from 'src/common/helpers';

export function getLogger(label) {
  return winston.loggers.get(label, {
    console: {
      label,
      timestamp: true,
    },
  });
}

export function wraps(func, options) {
  func.__name__ = options.name;
  func.__doc__ = options.doc;
  return func;
}

export function setError(ctx, code, error) {
  ctx.status = code;
  ctx.body = { error };
}
