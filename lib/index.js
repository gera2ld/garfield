const path = require('path');
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');

const args = require('./args');
const commands = require('./commands');

const app = Koa();

app.use(BodyParser());
app.use(function* () {
  const name = this.path.slice(1);
  const command = commands[name];
  if (!command) {
    this.status = 404;
    this.body = 'Command not found!';
    return;
  }
  const res = command.run();
  this.status = res.status;
  this.body = res.body;
});

app.listen(args.port);
