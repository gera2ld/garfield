const Sequelize = require('sequelize');

const sequelize = new Sequelize('db', null, null, {
  host: 'localhost',
  dialect: 'sqlite',
  storage: 'data/db.sqlite3',
});

module.exports = sequelize;
