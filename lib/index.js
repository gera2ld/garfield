const Koa = require('koa');
const BodyParser = require('koa-bodyparser');

const args = require('./args');
const commands = require('./commands');

const app = Koa();

app.use(BodyParser({enableTypes: ['json', 'form', 'text']}));
app.use(function* () {
  const name = this.path.slice(1);
  const command = commands[name];
  if (!command) {
    this.status = 404;
    this.body = 'Command not found!';
    return;
  }
  const res = command.run(this.request.body, this.method);
  console.log(`[${new Date}] <${this.ip}> ${res.status} ${res.body}`);
  this.status = res.status;
  this.body = res.body;
});

app.listen(args.port);
