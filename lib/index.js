const Koa = require('koa.io');
const BodyParser = require('koa-bodyparser');
const send = require('koa-send');

const args = require('./args');
const commands = require('./commands');
const logger = require('./logger');
const states = require('./states');

const app = Koa();
const optionsStatic = {
  root: __dirname,
};

app.use(BodyParser({enableTypes: ['json', 'form', 'text']}));
app.use(function* (next) {
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
  const name = this.path.slice(1);
  const command = commands[name];
  if (!command) this.throw(404, 'Command not found!');
  const res = command.run(this.request.body, this.method);
  states.put(res.payload);
  logger.info(`${res.status} ${res.body} <${this.ip}>`);
  this.status = res.status;
  this.body = res.body;
});

app.io.use(function* (next) {
  states.on('updated', state => {
    this.broadcast.emit('update', state.get());
  });
  yield* next;
});

app.io.route('list', function* (next) {
  const processing = states.processing.map(state => state.get());
  const done = states.done.map(state => state.get());
  this.emit('list', {
    processing,
    done,
  });
});

app.listen(args.port);
