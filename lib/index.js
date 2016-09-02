const Koa = require('koa.io');
const BodyParser = require('koa-bodyparser');

const args = require('./args');
const commands = require('./commands');
const logger = require('./logger');

const app = Koa();

app.use(BodyParser({enableTypes: ['json', 'form', 'text']}));
app.use(function* () {
  const name = this.path.slice(1);
  const command = commands[name];
  if (!command) this.throw(404, 'Command not found!');
  const res = command.run(this.request.body, this.method);
  logger.info(`${res.status} ${res.body} <${this.ip}>`);
  this.status = res.status;
  this.body = res.body;
});

app.listen(args.port);
