const {sync} = require('./utils');
const restful = require('./restful');
const Project = require('./project');
const Command = require('./command');
const Task = require('./task');

Project.hasMany(Command);
Command.belongsTo(Project);
Task.belongsTo(Command);

module.exports = {
  sync,
  restful,
  Project,
  Command,
  Task,
};
