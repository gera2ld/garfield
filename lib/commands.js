const path = require('path');
const args = require('./args');
const logger = require('./logger');
const jobs = require('./jobs');

class Command {
  constructor(name, options={}) {
    this.name = name;
    if (typeof options === 'function') options = {predicate: options};
    this.options = options;
  }

  execute(data) {
    const options = this.options;
    const key = data.jobKey || '';
    jobs.create(this, data);
    return {
      status: 201,
      body: 'Command is started!',
    };
  }

  run(payload, method) {
    const options = this.options;
    const res = !options.predicate || options.predicate(payload, method, options);
    if (!res) return {
      status: 200,
      body: 'Predicate failed!',
    }
    const data = Object.assign({}, options, typeof res === 'object' ? res : null);
    if (!data.command) return {
      status: 422,
      body: 'Command is missing!',
    };
    if (data.methods && !data.methods.includes(method)) return {
      status: 200,
      body: 'Predicate failed!',
    };
    return this.execute(data);
  }
}

try {
  const data = require(args.commands ? path.resolve(args.commands) : '../commands');
  const commands = {};
  // Node.js 6+ is required
  for (const key in data) {
    commands[key] = new Command(key, data[key]);
  }
  module.exports = commands;
} catch (e) {
  logger.error(e);
  process.exit(1);
}
