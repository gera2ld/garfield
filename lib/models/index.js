const db = require('./db');
const User = require('./user');
const Project = require('./project');
const Command = require('./command');
const Task = require('./task');

Project.hasMany(Command, {onDelete: 'CASCADE'});
Command.belongsTo(Project);
Command.hasMany(Task);
Task.belongsTo(Command);

module.exports = {
  sync: db.sync.bind(db),
  User,
  Project,
  Command,
  Task,
};
