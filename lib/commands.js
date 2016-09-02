const path = require('path');
const child_process = require('child_process');
const args = require('./args');
const logger = require('./logger');

const RUN = 'run';
const ERR = 'err';
const FIN = 'fin';

const getId = function (max) {
  var i = 0;
  return function () {
    if (max) i = i % max;
    return ++ i;
  };
}(0xffff);

class Job {
  constructor(command, child, data) {
    this.command = command;
    this.child = child;
    this.data = {
      id: getId(),
      description: data.description || command.name,
    };
    this.set(RUN);
  }

  set(state, message) {
    Object.assign(this.data, {state, message});
    this.changed();
  }

  change(func) {
    this.onChange = func;
    this.changed();
  }

  changed() {
    this.onChange && this.onChange(this.data);
  }
}

class Command {
  constructor(name, options={}) {
    this.name = name;
    if (typeof options === 'function') options = {predicate: options};
    this.options = options;
    this.running = {};
  }

  check(method) {
    const methods = this.options.methods;
    return !methods || ~methods.indexOf(method);
  }

  execute(data) {
    const options = this.options;
    const command = data.command;
    const jobKey = data.jobKey || '';
    this.running[jobKey] = (this.running[jobKey] || 0) + 1;
    logger.info(`Exec: ${command}`);
    const child = child_process.exec(command, {
      cwd: data.cwd,
      env: Object.assign({}, process.env, data.env),
      timeout: data.timeout,
    }, (err, stdout, stderr) => {
      if (err) {
        logger.error(`Aborted: ${command}`);
        logger.error(`  error: ${err}`);
        job.set(ERR, command + '\n' + err);
      } else {
        logger.info(`Finished: ${command}`);
        job.set(FIN);
      }
      this.running[jobKey] --;
    });
    const job = new Job(this, child, data);
    return {
      status: 201,
      body: 'Command is started!',
      payload: job,
    };
  }

  run(payload, method) {
    const options = this.options;
    const res = !options.predicate || options.predicate(payload, method, options);
    if (!res) return {
      status: 412,
      body: 'Predicate failed!',
    }
    const data = typeof res === 'object' ? Object.assign({}, options, res) : options;
    if (!data.command) return {
      status: 422,
      body: 'Command is missing!',
    };
    if (!data.concurrent && this.running[data.jobKey || '']) return {
      status: 429,
      body: 'Command is in process!',
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
