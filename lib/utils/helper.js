function permit(key, actions) {
  return function* (next) {
    const {id, permission} = this.state.user;
    let authorized = !!id;
    if (authorized && key) try {
      if (!Array.isArray(actions)) actions = [actions];
      authorized = actions.some(action => permission[key].includes(action));
    } catch (e) {
    }
    if (!authorized) {
      this.status = 401;
      this.body = {
        message: 'Not Authorized',
      };
    } else {
      yield* next;
    }
  };
}

exports.permit = permit;