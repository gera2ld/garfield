const path = require('path');
const child_process = require('child_process');
const args = require('./args');

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
    if (!this.check(method) || options.predicate && !options.predicate(payload, method)) return {
      status: 412,
      body: 'Predicate failed!',
    };
    this.running ++;
    const child = child_process.exec(options.command, {
      cwd: options.cwd,
      env: options.env,
      timeout: options.timeout,
    }, (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
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
  console.error(e);
  process.exit(1);
}
