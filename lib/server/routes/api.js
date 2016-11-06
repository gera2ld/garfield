const Router = require('koa-router');
const {restful, Project, Command, Task} = require('../../models');

const router = new Router({
  prefix: '/api',
})
.post('/projects', restful.create(Project))
.get('/projects', restful.list(Project))
.put('/projects/:id', restful.update(Project))
.del('/projects/:id', restful.remove(Project))

.get('/projects/:id/commands', restful.withParent(Project)(function* (project) {
  const commands = yield project.getCommands({
    joinTableAttributes: [],
  });
  this.body = commands;
}))
.post('/projects/:id/commands', restful.withParent(Project)(function* (project) {
  const command = yield Command.create(this.request.body);
  project.addCommand(command);
  this.body = command;
}))
.put('/commands/:id', restful.update(Command))
.del('/commands/:id', restful.remove(Command))

.get('/tasks', restful.list(Task, {
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
.del('/tasks/:id', restful.remove(Task))

module.exports = router.routes();
