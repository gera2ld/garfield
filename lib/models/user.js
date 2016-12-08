const Sequelize = require('sequelize');
const db = require('./db');

const User = db.define('user', {
  openId: {
    type: Sequelize.STRING,
    unique: true,
  },
  login: Sequelize.STRING,
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  avatar: Sequelize.STRING,
}, {
  onDelete: 'CASCADE',
});

module.exports = User;
