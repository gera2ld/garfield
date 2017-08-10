import { wraps, superPerm, permit, API, consts } from '../utils';
import models from '../models';
import { addCommands } from '../app/commands';

const api = new API({
  prefix: '/api',
})

.get('/me', permit(), wraps(ctx => {
  const { id, name, avatar, permissions } = ctx.state.user;
  ctx.body = { id, name, avatar, permissions };
}, {
  doc: 'Load info of current user.',
}))
.post('/projects', permit('project', 'create'), {
  Model: models.Project,
})
.getList('/projects', permit('project', 'show'), {
  Model: models.Project,
})
.put('/projects/:id', permit('project', 'modify'), {
  Model: models.Project,
})
.delete('/projects/:id', permit('project', 'modify'), {
  Model: models.Project,
})

.get('/projects/:id/commands', permit('project', 'show'), wraps(async ctx => {
  const { id } = ctx.params;
  const commands = await models.Command.findAll({
    include: [
      {
        model: models.Project,
        where: { id },
        attributes: [],
      },
    ],
  });
  ctx.body = { data: commands };
}, {
  doc: 'List commands of a project.',
}))
.post('/projects/:id/commands', permit('project', 'create'), wraps(async ctx => {
  const { id } = ctx.params;
  const project = await models.Project.findById(id);
  if (!project) {
    ctx.status = 404;
    ctx.body = {
      error: 'Project not exists.',
    };
    return;
  }
  const body = Object.assign({}, ctx.request.body, {
    projectId: id,
  });
  const command = await models.Command.create(body);
  ctx.body = { data: command };
}, {
  doc: 'Create a command for a project.',
}))
.put('/commands/:id', permit('project', 'modify'), {
  Model: models.Command,
})
.delete('/commands/:id', permit('project', 'modify'), {
  Model: models.Command,
})
.post('/commands/:id/run', async ctx => {
  const { id } = ctx.params;
  const command = await models.Command.findOne({
    where: { id },
  });
  if (!command) {
    ctx.status = 404;
    return;
  }
  await addCommands([command]);
  ctx.status = 201;
  ctx.body = {};
})

.getList('/tasks', permit('task', 'show'), {
  Model: models.Task,
  query(ctx) {
    const status = ctx.query.status ? ctx.query.status.split(',') : [consts.FINISHED, consts.ERROR];
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
        model: models.Command,
        include: [models.Project],
      }],
      order: [
        ['endedAt', 'DESC'],
      ],
    };
  },
})
.delete('/tasks/:id', permit('task', 'modify'), {
  Model: models.Task,
})

.getList('/users', permit('user', 'show'), {
  Model: models.User,
})
.patch('/users/:id', permit('user', 'modify'), {
  Model: models.User,
  getData(body) {
    const data = {};
    body = body || {};
    if (body.permissions != null) data.permissions = body.permissions;
    if (body.isEnabled != null) data.isEnabled = body.isEnabled;
    return data;
  },
})
.delete('/users/:id', permit('user', 'modify'), {
  Model: models.User,
})

.get('/consts/super_perm', permit('user', 'modify'), wraps(ctx => {
  ctx.body = superPerm;
}, {
  doc: 'Get permissions of super user.',
}));

export default api.routes();
