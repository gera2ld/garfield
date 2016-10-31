require('dotenv').config({silent: true});
const models = require('./models');

models.sync().then(() => require('./server'));
