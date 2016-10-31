const Router = require('koa-router');
const {restful, Project, Command} = require('../../models');

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
}));

module.exports = router.routes();
