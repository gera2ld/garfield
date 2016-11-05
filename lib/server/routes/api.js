const Router = require('koa-router');
const {restful, Project, Command, Task} = require('../../models');

const router = new Router({
  prefix: '/api',
})
.post('/projects', restful.create(Project))
.get('/projects', restful.list(Project))
.put('/projects/:id', restful.update(Project))
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
  order: `CASE status WHEN 'running' THEN 1 WHEN 'pending' THEN 2 WHEN 'error' THEN 3 ELSE 4 END`,
}))

module.exports = router.routes();
