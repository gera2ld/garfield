const Koa = require('koa.io');
const BodyParser = require('koa-bodyparser');
const tasks = require('./tasks');
const config = require('../config');
const {Task, Command, Project} = require('../models');

const app = new Koa({
  path: '/ws',
});

app
.use(BodyParser({enableTypes: ['json', 'form', 'text']}))
.use(require('./routes/api'))
.use(require('./routes/commands'))
.use(require('./routes/static'));

tasks.on('update', (taskData, changed) => {
  app.io.emit('update', Object.assign({
    id: taskData.id,
  }, changed));
});
tasks.on('log', (taskData, item) => {
  app.io.emit('log', Object.assign({
    id: taskData.id,
  }, item));
});
tasks.on('updateQueue', () => {
  listQueue().then(queue => app.io.emit('updateQueue', queue));
});

app.io.route('listQueue', function* (next) {
  const queue = yield listQueue();
  this.emit('updateQueue', queue);
});
app.io.route('readLog', function* (next, id) {
  const task = yield Task.objects.get({where: {id}});
  task && task.logData && this.emit('setLog', Object.assign({
    id: task.id,
  }, task.logData));
});

app.listen(config.get('PORT'), config.get('HOST'), err => {
  if (err) throw err;
  console.log(`Listening at port ${config.get('PORT')}...`);
});

tasks.safeRun();

function listQueue() {
  return Task.objects.findAll({
    include: [{model: Command, include: [Project]}],
    attributes: {
      exclude: ['log'],
    },
    where: {
      status: {
        $in: ['running', 'pending'],
      },
    },
    order: `CASE type WHEN 'running' THEN 1 WHEN 'pending' THEN 2 END`,
    limit: 100,
  });
}
