const models = require('../models');
const tasks = require('./tasks');

const commandTypes = {
  heads: 'branch',
  tags: 'tag',
};

function addCommands(commands) {
  return models.Task.bulkCreate(commands.map(command => ({commandId: command.id})))
  .then(() => {
    tasks.emit('updateQueue');
    tasks.safeRun();
  });
}

function* githook(project, payload) {
  const {ref} = payload;
  const match = ref && ref.match(/^refs\/(\w+)\/(.*)$/);
  if (!match) return {status: 400};
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
  const commands = yield project.getCommands({
    where,
    joinTableAttributes: [],
  });
  addCommands(commands);
  return {status: commands.length ? 201 : 200};
}

function* simple(project, payload) {
  const where = {
    type: 'simple',
    enabled: true,
  };
  if (payload && payload.data) where.data = {
    $in: [
      payload.data.toString(),
      ''
    ],
  };
  const commands = yield project.getCommands({
    where,
    joinTableAttributes: [],
  });
  addCommands(commands);
  return {status: commands.length ? 201 : 200};
}

const handlers = {
  githook,
  simple,
};

exports.run = function* (name, type, payload) {
  const project = yield models.Project.findOne({
    where: {
      name,
    },
  });
  if (!project) return {status: 404};
  const handle = handlers[type];
  if (handle) return yield handle(project, payload);
};

exports.runCommand = function* (...commands) {
  yield addCommands(commands);
};
