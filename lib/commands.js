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

class State {
  constructor(command, child) {
    this.id = getId();
    this.command = command;
    this.child = child;
    this.set(RUN);
  }

  get() {
    return {
      id: this.id,
      state: this.state,
      message: this.message,
    };
  }

  set(state, message) {
    this.state = state;
    this.message = message;
    this.onChange && this.onChange(this.get());
  }
}

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

  execute(res) {
    const options = this.options;
    const command = res.command || options.command;
    this.running ++;
    logger.info(`Exec: ${command}`);
    const child = child_process.exec(command, {
      cwd: res.cwd || options.cwd,
      env: Object.assign({}, process.env, options.env, res.env),
      timeout: res.timeout || options.timeout,
    }, (err, stdout, stderr) => {
      if (err) {
        logger.error(`Aborted: ${command}`);
        logger.error(`  error: ${err}`);
        state.set(ERR, command + '\n' + err);
      } else {
        logger.info(`Finished: ${command}`);
        state.set(FIN);
      }
      this.running --;
    });
    const state = new State(this, child);
    return {
      status: 201,
      body: 'Command is started!',
      payload: state,
    };
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
    return this.execute(predicateRes);
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
