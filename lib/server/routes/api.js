const Router = require('koa-router');
const restful = require('../../utils/restful');
const {Project, Command, Task} = require('../../models');
const {runCommand} = require('../commands');

function requirePermission(lb) {
  return function* (next) {
    const {id, permission} = this.state.user;
    if (!id || permission < lb) {
      this.status = 401;
      this.body = {
        message: 'Not Authorized',
      };
    } else {
      yield* next;
    }
  };
}

const perm0 = requirePermission(0);
const perm1 = requirePermission(1);

const router = new Router({
  prefix: '/api',
})
.get('/me', perm0, function* (next) {
  const {id, name, avatar, permission} = this.state.user;
  this.body = {id, name, avatar, permission};
})
.post('/projects', perm1, restful.create(Project))
.get('/projects', perm1, restful.list(Project))
.put('/projects/:id', perm1, restful.update(Project))
.del('/projects/:id', perm1, restful.remove(Project))

.get('/projects/:id/commands', perm1, restful.withParent(Project)(function* (project) {
  const commands = yield project.getCommands({
    joinTableAttributes: [],
  });
  this.body = commands;
}))
.post('/projects/:id/commands', perm1, restful.withParent(Project)(function* (project) {
  const command = yield Command.create(this.request.body);
  project.addCommand(command);
  this.body = command;
}))
.put('/commands/:id', perm1, restful.update(Command))
.del('/commands/:id', perm1, restful.remove(Command))
.post('/commands/:id/run', perm1, function* (next) {
  const {id} = this.params;
  const command = yield Command.findById(id);
  if (!command) {
    this.status = 404;
    return;
  }
  yield runCommand(command);
  this.status = 201;
  this.body = {};
})

.get('/tasks', perm1, restful.list(Task, {
  attributes: {
    exclude: ['log'],
  },
  include: [{
    model: Command,
    include: [Project],
  }],
  where(query) {
    const qStatus = query.status && query.status.split(',');
    const status = [
      'error',
      'finished',
    ].filter(key => !query.status || query.status.includes(key));
    return {
      status: {
        $in: status,
      },
    };
  },
  order: [
    ['endedAt', 'DESC'],
  ],
  // order: `CASE status WHEN 'error' THEN 1 WHEN 'finished' THEN 2 END`,
}))
.del('/tasks/:id', perm1, restful.remove(Task))

module.exports = router.routes();
