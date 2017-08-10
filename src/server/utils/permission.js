import { wraps, setError, object } from './helpers';

const actionMap = {
  modify: ['create', 'modify'],
  show: ['create', 'modify', 'show'],
};

export const superPerm = {
  project: ['create', 'modify', 'show'],
  task: ['create', 'modify', 'show'],
  user: ['create', 'modify', 'show'],
};

export function permit(key, actions) {
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
  return wraps(async (ctx, next) => {
    const { user } = ctx.state;
    if (!object.get(user, 'id')) return setError(ctx, 401, 'Not authorized');
    let authorized = user.isEnabled;
    if (authorized && key) {
      const permissions = object.get(user, ['permissions', key]) || [];
      authorized = actions.some(action => permissions.includes(action));
    }
    if (!authorized) return setError(ctx, 403, 'Forbidden');
    await next();
  }, {
    name: 'permit',
    doc: `Require permission: ${key ? [key].concat(actions).filter(i => i).join('.') : 'logged in'}`,
  });
}
