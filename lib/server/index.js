const Koa = require('koa.io');
const BodyParser = require('koa-bodyparser');
const tasks = require('./tasks');
const logger = require('./logger');
const config = require('../config');
const utils = require('../utils');
const {superPerm} = require('../utils/helper');
const models = require('../models');
const {Task, Command, Project} = require('../models');
const TOKEN_KEY = config.get('TOKEN_KEY');
const isProd = config.get('NODE_ENV') === 'production';
let superUsers = config.get('SUPER_USERS');
if (!Array.isArray(superUsers)) superUsers = null;
superUsers = superUsers || [];

function* checkAuth(next) {
  let user = utils.cookies.get(this, TOKEN_KEY);
  const data = user && user.id && (yield models.User.findOne({
    where: {
      id: user.id,
      removed: false,
    },
  }));
  if (data) {
    user.name = data.name;
    user.avatar = data.avatar;
    try {
      user.permission = JSON.parse(data.permission);
    } catch (e) {
    }
    if (superUsers.includes(user.id)) user.permission = superPerm;
  } else {
    user = null;
  }
  this.state.user = Object.assign({
    name: '未登录用户',
    permission: {},
  }, user);
  yield* next;
}

function* logRequest(next) {
  yield* next;
  const qs = this.querystring ? '?' + this.querystring : '';
  logger.info(`${this.method} ${this.path}${qs} ${this.status}`);
}

const app = new Koa({
  path: '/ws',
});
app.keys = [utils.getKey()];

if (!isProd) {
  app
  .use(logRequest)
}

app
.use(BodyParser({enableTypes: ['json', 'form', 'text']}))
.use(checkAuth)
.use(require('../routes/account'))
.use(require('../routes/api'))
.use(require('../routes/commands'))
.use(require('../routes/static'));

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
