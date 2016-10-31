const Sequelize = require('sequelize');
const db = require('./db');

const Task = db.define('task', {
  status: {
    type: Sequelize.ENUM('pending', 'running', 'finished', 'error'),
    defaultValue: 'pending',
  },
  startedAt: Sequelize.DATE,
  endedAt: Sequelize.DATE,
  error: Sequelize.TEXT,
  log: Sequelize.TEXT,
});

Task.objects = {
  get(...args) {
    return Task.findOne(...args)
    .then(task => {
      task.logData = task.log ? JSON.parse(task.log) : {};
      return task;
    });
  },
};

module.exports = Task;
