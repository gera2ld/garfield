const path = require('path');
const mkdirp = require('mkdirp');
const config = require('../config');

const dataDir = config.get('DATA_DIR');
mkdirp.sync(dataDir);

const Sequelize = require('sequelize');

const sequelize = new Sequelize('db', null, null, {
  host: 'localhost',
  dialect: 'sqlite',
  storage: path.resolve(dataDir, 'db.sqlite3'),
});

module.exports = sequelize;
