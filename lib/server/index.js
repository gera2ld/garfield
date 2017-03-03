const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const tasks = require('./tasks');
const config = require('../config');
const {getLogger, cookies, permission: {superPerm}} = require('../utils');
const models = require('../models');
const socket = require('./socket');

const TOKEN_KEY = config.get('TOKEN_KEY');
const isProd = config.get('NODE_ENV') === 'production';
let superUsers = config.get('SUPER_USERS');
superUsers = Array.isArray(superUsers) ? superUsers : [];
const logger = getLogger('server');

async function checkAuth(ctx, next) {
  let user = cookies.get(ctx, TOKEN_KEY);
  const data = user && user.id && await models.user.findOne({
    where: {
      id: user.id,
    },
  });
  if (data) {
    user.name = data.name;
    user.avatar = data.avatar;
    if (superUsers.includes(user.id)) {
      user.isEnabled = true;
      user.permissions = superPerm;
    } else {
      user.isEnabled = data.isEnabled;
      user.permissions = data.permissions;
    }
  } else {
    user = null;
  }
  ctx.state.user = Object.assign({
    name: '未登录用户',
    permissions: {},
  }, user);
  await next();
}

async function logRequest(ctx, next) {
  await next();
  const qs = ctx.querystring ? '?' + ctx.querystring : '';
  logger.info(`${ctx.method} ${ctx.path}${qs} ${ctx.status}`);
}

const app = new Koa();
app.keys = [config.get('SECRET_KEY')];

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

socket.initialize(app);
app.io.route('listQueue', async function (client) {
  const queue = await listQueue();
  client.emit('updateQueue', queue);
});
app.io.route('readLog', async function (client, id) {
  const task = await models.task.findById(id);
  const data = task.log;
  task && task.log && client.emit('setLog', Object.assign({
    id: task.id,
  }, task.log));
});

app.listen(config.get('PORT'), config.get('HOST'), err => {
  if (err) throw err;
  console.log(`Listening at port ${config.get('PORT')}...`);
});

tasks.safeRun();

function listQueue() {
  return models.task.findAll({
    include: [
      {
        model: models.command,
        include: [models.project],
      },
    ],
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
