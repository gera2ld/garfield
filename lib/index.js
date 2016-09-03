const Koa = require('koa.io');
const BodyParser = require('koa-bodyparser');
const send = require('koa-send');

const args = require('./args');
const commands = require('./commands');
const logger = require('./logger');
const states = require('./states');

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
  const res = command.run(this.request.body, this.method);
  res.payload && states.put(res.payload);
  logger.info(`${res.status} ${res.body || '-'} <${this.ip}>`);
  this.status = res.status;
  if (res.body) this.body = res.body;
});

states.on('updated', state => {
  app.io.emit('update', state.data);
});

app.io.route('list', function* (next) {
  this.emit('list', states.getAll());
});

app.listen(args.port);
