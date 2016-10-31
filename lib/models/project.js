const Sequelize = require('sequelize');
const db = require('./db');

const Project = db.define('project', {
  name: {
    type: Sequelize.STRING,
    unique: true,
  },
  desc: Sequelize.TEXT,
});

module.exports = Project;
