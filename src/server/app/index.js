import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import { objectGet } from '#/common/object';
import nconf from '../config';
import { getLogger, cookies, superPerm, consts } from '../utils';
import events from '../utils/events';
import models from '../models';
import initSocket from './socket';
import routeAccount from '../routes/account';
import routeStatic from '../routes/static';
import routeAPI from '../routes/api';
import routeCommand from '../routes/commands';
import worker from './worker';

const logger = getLogger('server');
const TOKEN_KEY = nconf.get('TOKEN_KEY');
const IS_PROD = nconf.get('NODE_ENV') === 'production';
let superUsers = nconf.get('SUPER_USERS');
if (!Array.isArray(superUsers)) superUsers = [];

const app = new Koa();
app.keys = [nconf.get('SECRET_KEY')];

if (!IS_PROD) {
  app.use(async (ctx, next) => {
    await next();
    logger.info(`${ctx.method} ${ctx.url} ${ctx.status}`);
  });
}

app
.use(BodyParser({ enableTypes: ['json'] }))
.use(checkAuth)
.use(routeAccount)
.use(routeAPI)
.use(routeCommand)
.use(routeStatic);

initSocket(app);
app.io.route('listQueue', async client => {
  const queue = await listQueue();
  client.emit('updateQueue', queue);
});
app.io.route('readLog', async (client, id) => {
  const task = await models.Task.findById(id);
  if (task && task.log) {
    client.emit('setLog', {
      id: task.id,
      ...task.log,
    });
  }
});

app.listen(nconf.get('PORT'), nconf.get('HOST'), err => {
  if (err) throw err;
  console.info(`Listening at port ${nconf.get('PORT')}...`);
});

events.on('update', ({ id }, changed) => {
  app.io.emit('update', {
    id,
    ...changed,
  });
});
events.on('log', ({ id }, item) => {
  app.io.emit('log', {
    id,
    ...item,
  });
});
events.on('updateQueue', async () => {
  const queue = await listQueue();
  app.io.emit('updateQueue', queue);
});

worker.safeRun();

async function checkAuth(ctx, next) {
  let user = cookies.get(ctx, TOKEN_KEY);
  const id = objectGet(user, 'id');
  const model = id && await models.User.findOne({
    where: { id },
  });
  if (model) {
    user.name = model.name;
    user.avatar = model.avatar;
    if (superUsers.includes(id)) {
      user.isEnabled = true;
      user.permissions = superPerm;
    } else {
      user.isEnabled = model.isEnabled;
      user.permissions = model.permissions;
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

async function listQueue() {
  return models.Task.findAll({
    include: [
      {
        model: models.Command,
        include: [models.Project],
      },
    ],
    attributes: {
      exclude: ['log'],
    },
    where: {
      status: {
        $in: [consts.PENDING, consts.RUNNING],
      },
    },
    order: [['status', 'DESC']],
    limit: 100,
  });
}
