const child_process = require('child_process');
const EventEmitter = require('events');
const logger = require('./logger');

const MAX_LOG_LENGTH = 10 * 1024;
const RUN = 'run';
const ERR = 'err';
const FIN = 'fin';

const getId = function (max) {
  var i = 0;
  return function () {
    if (max) i = i % max;
    return (++ i).toString(16);
  };
}(0xffff);

class Job extends EventEmitter {
  constructor(parent, command, options) {
    super();
    this.parent = parent;
    this.command = command;
    this.options = options;
    this.logs = {length: 0, data: []};
    this.data = {
      id: getId(),
      description: options.description || command.name,
      hasLogs: false,
    };
  }

  get id() {
    return this.data.id;
  }

  run() {
    if (this.data.state === RUN) return;
    this.child = this.start();
  }

  start() {
    const data = this.options;
    const command = data.command;
    logger.info(`Exec: ${command}`);
    this.set(RUN);
    const child = child_process.exec(command, {
      cwd: data.cwd,
      env: Object.assign({}, process.env, data.env),
      timeout: data.timeout,
    }, (err, stdout, stderr) => {
      this.child = null;
      if (err) {
        logger.error(`Aborted: ${command}`);
        logger.error(`  error: ${err}`);
        this.set(ERR, command + '\n' + err);
      } else {
        logger.info(`Finished: ${command}`);
        this.set(FIN);
      }
    });
    child.stdout.on('data', chunk => this.log('out', chunk));
    child.stderr.on('data', chunk => this.log('err', chunk));
    return child;
  }

  timestamp() {
    return Date.now();
  }

  set(state, message) {
    Object.assign(this.data, {state, message});
    if (state === RUN) {
      this.data.startAt = this.timestamp();
      this.data.endAt = null;
    } else if ([FIN, ERR].includes(state)) {
      this.data.endAt = this.timestamp();
    }
    this.emit('change', this);
  }

  log(type, chunk) {
    this.data.hasLogs = true;
    var last = this.logs.data[this.logs.data.length - 1];
    while (chunk) {
      var data;
      if (chunk.length > MAX_LOG_LENGTH) {
        data = chunk.slice(0, MAX_LOG_LENGTH);
        chunk = chunk.slice(MAX_LOG_LENGTH);
      } else {
        data = chunk;
        chunk = null;
      }
      const item = {
        type,
        data,
        offset: last ? last.offset + last.data.length : 0,
      };
      this.logs.data.push(item);
      this.logs.length += data.length;
      this.parent.log(this, item);
      last = item;
    }
    while (this.logs.length > MAX_LOG_LENGTH) {
      const discard = this.logs.shift();
      this.logs.length - discard.data.length;
    }
  }
}

class JobSet extends EventEmitter {
  constructor(maxCache) {
    super();
    this.max = maxCache || 20;
    this.done = [];
    this.processing = [];
    this.handlers = {};
    this.logs = {};
  }

  add(job) {
    if (this.processing.includes(job)) return;
    this.processing.push(job);
    job.on('change', () => this.update(job));
  }

  update(job) {
    const data = job.data;
    if (['err', 'fin'].includes(data.job)) {
      const i = this.processing.indexOf(job);
      ~i && this.processing.splice(i, 1);
      this.done.push(job);
      if (this.done.length > this.max) this.done.shift();
    }
    this.emit('update', job);
  }

  log(job, item) {
    this.emit('log', job, item);
  }

  getAll() {
    const processing = this.processing.map(job => job.data);
    const done = this.done.map(job => job.data);
    return {processing, done};
  }

  create(command, data, events = {}) {
    const job = new Job(this, command, data);
    Object.keys(events).forEach(key => {
      const handle = events[key];
      handle && job.on(key, handle);
    });
    this.add(job);
    job.run();
    return job;
  }

  find(id) {
    return this.processing.find(item => item.id === id) || this.done.find(item => item.id === id);
  }
}

module.exports = new JobSet;
