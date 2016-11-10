require('dotenv').config({silent: true});
process.env.DATA_DIR = require('path').resolve(process.env.DATA_DIR || 'data');
require('./models').sync().then(() => require('./server'));
