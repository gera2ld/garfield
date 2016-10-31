const Sequelize = require('sequelize');

const sequelize = new Sequelize('db', null, null, {
  host: 'localhost',
  dialect: 'sqlite',
  storage: 'db.sqlite3',
});

module.exports = sequelize;
