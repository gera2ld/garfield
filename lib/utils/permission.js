const {wraps} = require('.');

const actionMap = {
  modify: ['create', 'modify'],
  show: ['create', 'modify', 'show'],
};
const superPerm = {
  project: ['create', 'modify', 'show'],
  task: ['create', 'modify', 'show'],
  user: ['create', 'modify', 'show'],
};

function permit(key, actions) {
  /**
   * permissions:
   * - show
   * - modify
   * - create
   */
  if (typeof actions === 'string') {
    actions = actionMap[actions] || [actions];
  } else if (!actions) {
    actions = [];
  }
  return wraps(async function permit(ctx, next) {
    const {user} = ctx.state;
    if (!user || !user.id) {
      ctx.status = 401;
      ctx.body = {
        error: 'Not authorized',
      };
      return;
    }
    let authorized = user.isEnabled;
    if (authorized && key) {
      const permissions = user.permissions && user.permissions[key] || [];
      authorized = authorized && actions.some(action => permissions.includes(action));
    }
    if (!authorized) {
      ctx.status = 403;
      ctx.body = {
        error: 'Forbidden',
      };
      return;
    }
    await next();
  }, {
    doc: `Require permission: ${key ? [key].concat(actions).filter(i => i).join('.') : 'logged in'}`,
  });
}

exports.superPerm = superPerm;
exports.permit = permit;
