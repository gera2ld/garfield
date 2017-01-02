const Router = require('koa-router');
const restful = require('../../utils/restful');
const {permit} = require('../../utils/helper');
const {Project, Command, Task, User} = require('../../models');
const {runCommand} = require('../commands');

const router = new Router({
  prefix: '/api',
})
.get('/me', permit({status: 401, error: 'Not authorized'}), function* (next) {
  const {id, name, avatar, permission} = this.state.user;
  this.body = {id, name, avatar, permission};
})
.post('/projects', permit('project', 'create'), restful.create(Project))
.get('/projects', permit('project', 'show'), restful.list(Project, {
  where: {
    removed: false,
  },
}))
.put('/projects/:id', permit('project', 'modify'), restful.update(Project))
.del('/projects/:id', permit('project', 'modify'), restful.remove(Project, {
  handle(model) {
    return model.update({
      removed: true,
    });
  },
}))

.get('/projects/:id/commands', permit('project', 'show'), restful.withParent(Project)(function* (project) {
  const commands = yield project.getCommands({
    joinTableAttributes: [],
  });
  this.body = commands;
}))
.post('/projects/:id/commands', permit('project', 'create'), restful.withParent(Project)(function* (project) {
  const command = yield Command.create(this.request.body);
  project.addCommand(command);
  this.body = command;
}))
.put('/commands/:id', permit('project', 'modify'), restful.update(Command))
.del('/commands/:id', permit('project', 'modify'), restful.remove(Command, {
  handle(model) {
    return model.update({
      removed: true,
    });
  },
}))
.post('/commands/:id/run', function* (next) {
  const {id} = this.params;
  const command = yield Command.findOne({
    where: {
      id,
      removed: false,
    }
  });
  if (!command) {
    this.status = 404;
    return;
  }
  yield runCommand(command);
  this.status = 201;
  this.body = {};
})

.get('/tasks', permit('task', 'show'), restful.list(Task, {
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
    ].filter(key => !qStatus || qStatus.includes(key));
    return {
      removed: false,
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
.del('/tasks/:id', permit('task', 'modify'), restful.remove(Task, {
  handle(model) {
    return model.update({
      removed: true,
    });
  },
}))

.get('/users', permit('user', 'modify'), restful.list(User, {
  where: {
    removed: false,
  },
}))
.put('/users/:id', permit('user', 'modify'), restful.update(User))
.del('/users/:id', permit('user', 'modify'), restful.remove(User, {
  handle(model) {
    return model.update({
      removed: true,
    });
  },
}))

module.exports = router.routes();
