const Koa = require('koa.io');
const BodyParser = require('koa-bodyparser');
const tasks = require('./tasks');

const app = new Koa({
  path: '/ws',
});

app
.use(BodyParser({enableTypes: ['json', 'form', 'text']}))
.use(require('./routes/api'))
.use(require('./routes/commands'))
.use(require('./routes/static'));

tasks.on('update', taskData => {
  app.io.emit('update', [
    'id',
    'status',
    'startedAt',
    'endedAt',
    'error',
  ].reduce((res, key) => {
    res[key] = taskData[key];
    return res;
  }, {}));
});
tasks.on('log', (taskData, item) => {
  app.io.emit('log', Object.assign({
    id: taskData.id,
  }, item));
});

app.io.route('readLog', function* (next, id) {
  const task = yield models.Task.objects.get({id});
  task && task.logData && this.emit('log', Object.assign({
    id: task.id,
  }, task.logData));
});

const {PORT=2333, HOST=''} = process.env;
app.listen(PORT, HOST, err => {
  console.log(`Listening at port ${PORT}...`);
});

tasks.safeRun();
