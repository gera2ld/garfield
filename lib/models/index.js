const db = require('./db');
const User = require('./user');
const Project = require('./project');
const Command = require('./command');
const Task = require('./task');

Project.hasMany(Command, {onDelete: 'CASCADE'});
Command.belongsTo(Project);
Command.hasMany(Task);
Task.belongsTo(Command);
Project.belongsToMany(User, {through: 'userProject'});
User.belongsToMany(Project, {through: 'userProject'});

module.exports = {
  db,
  User,
  Project,
  Command,
  Task,
};
