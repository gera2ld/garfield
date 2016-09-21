const Koa = require('koa.io');
const BodyParser = require('koa-bodyparser');
const send = require('koa-send');

const args = require('./args');
const commands = require('./commands');
const logger = require('./logger');
const jobs = require('./jobs');

const app = new Koa({
  path: '/_ws',
});
const optionsStatic = {
  root: __dirname,
};

app.use(BodyParser({enableTypes: ['json', 'form', 'text']}));

app.use(function* (next) {
  // static files
  var path = this.path;
  // index.html MUST be fetched from '/' due to relative paths
  if (path === '/_static/index.html') this.throw(403);
  if (path === '/') path = '/_static/index.html';
  if (path.startsWith('/_')) {
    yield send(this, path, optionsStatic);
  } else {
    yield* next;
  }
});

app.use(function* () {
  // commands
  const name = this.path.slice(1);
  const command = commands[name];
  if (!command) this.throw(404, 'Command not found!');
  const res = command.run(this.request.body, this.method) || {status: 200};
  logger.info(`${res.status} ${res.body || '-'} <${this.ip}>`);
  this.status = res.status;
  if (res.body) this.body = res.body;
});

jobs.on('update', job => {
  app.io.emit('update', job.data);
});
jobs.on('log', (job, item) => {
  app.io.emit('log', Object.assign({
    id: job.id,
  }, item));
});

app.io.route('list', function* (next) {
  this.emit('list', jobs.getAll());
});
app.io.route('readLog', function* (next, id) {
  const job = jobs.find(id);
  job && job.logs.data.forEach(item => this.emit('log', Object.assign({
    id: job.id,
  }, item)));
});
app.io.route('redo', function* (next, id) {
  jobs.redo(id);
});

app.listen(args.port, args.host);
