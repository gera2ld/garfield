const Sequelize = require('sequelize');
const db = require('./db');
const Project = require('./project');
const Task = require('./task');

const Command = db.define('command', {
  desc: Sequelize.TEXT,
  type: Sequelize.STRING,
  data: Sequelize.STRING,
  script: Sequelize.TEXT,
  enabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  removed: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
}, {
  indexes: [{
    unique: true,
    fields: ['projectId', 'type', 'data'],
  }],
});

module.exports = Command;
