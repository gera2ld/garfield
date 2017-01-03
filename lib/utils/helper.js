const actionMap = {
  modify: ['create', 'modify'],
  show: ['create', 'modify', 'show'],
};
const superPerm = {
  project: ['create', 'modify', 'show'],
  user: ['create', 'modify', 'show'],
};

function permit(key, actions, body) {
  if (typeof key === 'object') {
    body = key;
    key = actions = null;
  }
  actions = actionMap[actions] || actions || [];
  if (!Array.isArray(actions)) actions = [actions];
  body = Object.assign({
    status: 403,
    error: 'Not allowed',
  }, body);
  return function* (next) {
    const {id, permission} = this.state.user;
    let authorized = !!id;
    if (authorized && key) {
      try {
        authorized = actions.some(action => permission[key].includes(action));
      } catch (e) {
      }
    }
    if (!authorized) {
      this.status = body.status;
      this.body = body;
    } else {
      yield* next;
    }
  };
}

exports.superPerm = superPerm;
exports.permit = permit;
