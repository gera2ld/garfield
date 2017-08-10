import models from '../models';
import { events } from '../utils';

const commandTypes = {
  heads: 'branch',
  tags: 'tag',
};

export async function addCommands(commands) {
  if (!commands || !commands.length) return;
  await models.Task.bulkCreate(commands.map(command => ({
    commandId: command.id,
  })));
  events.emit('updateQueue');
  return commands.length;
}

async function githook(project, payload) {
  const { ref } = payload;
  const match = ref && ref.match(/^refs\/(\w+)\/(.*)$/);
  if (!match) return { status: 400 };
  const commandType = commandTypes[match[1]];
  const where = {
    type: 'githook',
    enabled: true,
    data: {
      $in: [
        `${commandType}/${match[2]}`,
        `${commandType}/`,
        '/',
      ],
    },
  };
  const commands = await project.getCommands({
    where,
    joinTableAttributes: [],
  });
  const res = await addCommands(commands);
  return { status: res ? 201 : 200 };
}

async function simple(project, payload) {
  const where = {
    type: 'simple',
    enabled: true,
  };
  if (payload && payload.data) {
    where.data = {
      $in: [
        payload.data.toString(),
        '',
      ],
    };
  }
  const commands = await project.getCommands({
    where,
    joinTableAttributes: [],
  });
  const res = await addCommands(commands);
  return { status: res ? 201 : 200 };
}

const handlers = {
  githook,
  simple,
};

export async function runCommand(name, type, payload) {
  const project = await models.Project.findOne({
    where: {
      name,
    },
  });
  if (!project) return { status: 404 };
  const handle = handlers[type];
  if (handle) return handle(project, payload);
}
