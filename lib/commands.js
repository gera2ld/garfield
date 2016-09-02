const path = require('path');
const child_process = require('child_process');
const args = require('./args');
const logger = require('./logger');

class Command {
  constructor(name, options={}) {
    this.name = name;
    this.options = options;
    this.running = 0;
  }

  check(method) {
    const methods = this.options.methods;
    return !methods || ~methods.indexOf(method);
  }

  run(payload, method) {
    const options = this.options;
    if (this.running && !options.allowConcurrency) return {
      status: 429,
      body: 'Command is in process!',
    };
    const predicateRes = this.check(method) && (!options.predicate || options.predicate(payload, method));
    if (!predicateRes) return {
      status: 412,
      body: 'Predicate failed!',
    };
    this.running ++;
    const command = predicateRes.command || options.command;
    logger.info(`Exec: ${command}`);
    const child = child_process.exec(command, {
      cwd: predicateRes.cwd || options.cwd,
      env: Object.assign({}, process.env, options.env, predicateRes.env),
      timeout: predicateRes.timeout || options.timeout,
    }, (err, stdout, stderr) => {
      if (err) {
        logger.error(`Aborted: ${command}`);
        logger.error(`  error: ${err}`);
      } else {
        logger.info(`Finished: ${command}`);
      }
      this.running --;
    });
    return {
      status: 201,
      body: 'Command is started!',
      payload: child,
    };
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
