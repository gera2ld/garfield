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

function parseLogs(task) {
  task.logData = task.log ? JSON.parse(task.log) : {};
}

Task.objects = {
  get(...args) {
    return Task.findOne(...args)
    .then(task => {
      task && parseLogs(task);
      return task;
    });
  },
  findAll(...args) {
    return Task.findAll(...args)
    .then(tasks => {
      tasks.forEach(parseLogs);
      return tasks;
    });
  },
};

module.exports = Task;
