const db = require('./db');

function withTransaction(func) {
  return function (...args) {
    return db.transaction(t => func(t, ...args));
  };
}

exports.sync = db.sync.bind(db);
exports.withTransaction = withTransaction;
