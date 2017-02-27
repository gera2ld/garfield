const Router = require('koa-router');
const {
  wraps,
  permission: {superPerm, permit},
  restful: {API},
} = require('../utils');
const models = require('../models');
const {runCommand} = require('../server/commands');
const config = require('../config');

const api = new API({
  prefix: '/api',
})

.get('/me', permit(), wraps(function (ctx) {
  const {id, name, avatar, permissions} = ctx.state.user;
  ctx.body = {id, name, avatar, permissions};
}, {
  doc: 'Load info of current user.',
}))
.post('/projects', permit('project', 'create'), {
  Model: models.project,
})
.getList('/projects', permit('project', 'show'), {
  Model: models.project,
})
.put('/projects/:id', permit('project', 'modify'), {
  Model: models.project,
})
.delete('/projects/:id', permit('project', 'modify'), {
  Model: models.project,
})

.get('/projects/:id/commands', permit('project', 'show'), wraps(async function (ctx, next) {
  const {id} = ctx.params;
  const commands = await models.command.findAll({
    include: [
      {
        model: models.project,
        where: {id},
        attributes: [],
      },
    ],
  });
  ctx.body = commands;
}, {
  doc: 'List commands of a project.',
}))
.post('/projects/:id/commands', permit('project', 'create'), wraps(async function (ctx, next) {
  const {id} = ctx.params;
  const body = Object.assign({}, ctx.request.body, {
    projectId: id,
  });
  const command = await models.command.create(body);
  project.addCommand(command);
  ctx.body = command;
}, {
  doc: 'Create a command for a project.',
}))
.put('/commands/:id', permit('project', 'modify'), {
  Model: models.command,
})
.delete('/commands/:id', permit('project', 'modify'), {
  Model: models.command,
})
.post('/commands/:id/run', async function (ctx, next) {
  const {id} = ctx.params;
  const command = await models.command.findOne({
    where: {id},
  });
  if (!command) {
    ctx.status = 404;
    return;
  }
  await runCommand(command);
  ctx.status = 201;
  ctx.body = {};
})

.getList('/tasks', permit('task', 'show'), {
  Model: models.task,
  query(ctx) {
    const qStatus = ctx.query.status && ctx.query.status.split(',');
    const status = [
      'error',
      'finished',
    ].filter(key => !qStatus || qStatus.includes(key));
    const where = {
      status: {
        $in: status,
      },
    };
    return {
      where,
      attributes: {
        exclude: ['log'],
      },
      include: [{
        model: models.command,
        include: [models.project],
      }],
      order: [
        ['endedAt', 'DESC'],
      ],
      // order: `CASE status WHEN 'error' THEN 1 WHEN 'finished' THEN 2 END`,
    };
  },
})
.delete('/tasks/:id', permit('task', 'modify'), {
  Model: models.task,
})

.getList('/users', permit('user', 'show'), {
  Model: models.user,
})
.patch('/users/:id', permit('user', 'modify'), {
  Model: models.user,
  getData(body) {
    return {
      permissions: body && body.permissions,
    };
  },
})
.delete('/users/:id', permit('user', 'modify'), {
  Model: models.user,
})

.get('/consts/super_perm', permit('user', 'modify'), wraps(function (ctx) {
  ctx.body = superPerm;
}, {
  doc: 'Get permissions of super user.',
}))

module.exports = api.routes();
