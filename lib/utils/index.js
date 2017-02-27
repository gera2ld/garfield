const winston = require('winston');

exports.getLogger = function getLogger(label) {
  return winston.loggers.get(label, {
    console: {
      label,
      timestamp: true,
    },
  });
};

exports.wraps = function (func, options) {
  func.__name__ = options.name;
  func.__doc__ = options.doc;
  return func;
};

exports.Logs = require('./logs');
exports.cookies = require('./cookies');
exports.permission = require('./permission');
exports.restful = require('./restful');
