const child_process = require('child_process');
const EventEmitter = require('events');
const logger = require('./logger');

const MAX_LOG_LENGTH = 10 * 1024;
const PENDING = 'pending';
const RUNNING = 'running';
const ERROR = 'error';
const FINISHED = 'finished';

const getId = function (max) {
  var i = 0;
  return function () {
    if (max) i = i % max;
    return (++ i).toString(16);
  };
}(0xffff);

function getJobKey(command, options) {
  return `${command.name}\n${options.jobKey || ''}`;
}

class Job extends EventEmitter {
  constructor(parent, command, options) {
    super();
    this.parent = parent;
    this.command = command;
    this.options = options;
    this.key = getJobKey(command, options);
    this.logs = {length: 0, data: []};
    this.data = {
      id: getId(),
      description: options.description || command.name,
      hasLogs: false,
    };
    this.set(PENDING);
  }

  get id() {
    return this.data.id;
  }

  start() {
    const data = this.options;
    const command = data.command;
    logger.info(`Exec: ${command}`);
    this.set(RUNNING);
    const child = this.child = child_process.exec(command, {
      cwd: data.cwd,
      env: Object.assign({}, process.env, data.env),
      timeout: data.timeout,
    }, (err, stdout, stderr) => {
      this.child = null;
      if (err) {
        logger.error(`Aborted: ${command}`);
        logger.error(`  error: ${err}`);
        this.set(ERROR, command + '\n' + err);
      } else {
        logger.info(`Finished: ${command}`);
        this.set(FINISHED);
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
    const oldState = this.data.state;
    Object.assign(this.data, {state, message});
    if (state === RUNNING) {
      this.data.startAt = this.timestamp();
      this.data.endAt = null;
    } else if ([FINISHED, ERROR].includes(state)) {
      this.data.endAt = this.timestamp();
    }
    this.emit('change', this, oldState);
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
      const discard = this.logs.data.shift();
      this.logs.length -= discard.data.length;
    }
  }
}

class JobSet extends EventEmitter {
  constructor(maxCache, maxConcurrency) {
    super();
    this.maxCache = maxCache || 20;
    this.maxConcurrency = maxConcurrency || 1;
    this.pending = [];
    this.processing = [];
    this.done = [];
    this.listMap = {
      [PENDING]: this.pending,
      [RUNNING]: this.processing,
      [ERROR]: this.done,
      [FINISHED]: this.done,
    };
  }

  add(job) {
    if (this.addToList(this.listMap[job.data.state], job)) {
      job.on('change', (job, oldState) => this.update(job, oldState));
      this.emit('update', job);
    }
  }

  removeFromList(list, item) {
    if (!list) return;
    const i = list.indexOf(item);
    if (~i) {
      list.splice(i, 1);
      return true;
    }
  }

  addToList(list, item) {
    if (list && !list.includes(item)) {
      list.push(item);
      return true;
    }
  }

  update(job, oldState) {
    this.removeFromList(this.listMap[oldState], job);
    this.addToList(this.listMap[job.data.state], job);
    if ([ERROR, FINISHED].includes(job.data.state)) {
      if (this.done.length > this.maxCache) this.done.shift();
      this.run();
    }
    this.emit('update', job);
  }

  log(job, item) {
    this.emit('log', job, item);
  }

  getAll() {
    return ['pending', 'processing', 'done']
    .reduce((res, key) => {
      res[key] = this[key].map(job => job.data);
      return res;
    }, {});
  }

  create(command, data, events = {}) {
    const key = getJobKey(command, data);
    const pendingJob = this.pending.find(job => job.key === key);
    if (pendingJob) return pendingJob;
    const job = new Job(this, command, data);
    Object.keys(events).forEach(key => {
      const handle = events[key];
      handle && job.on(key, handle);
    });
    this.add(job);
    this.run();
    return job;
  }

  find(id, list) {
    list = list || this.processing.concat(this.done);
    return list.find(item => item.id === id);
  }

  redo(id) {
    const job = this.done.find(job => job.id === id);
    job.set(PENDING);
    this.run();
  }

  run() {
    for (var i = 0; i < this.pending.length && this.processing.length < this.maxConcurrency; i ++) {
      const job = this.pending[i];
      if (this.processing.find(item => item.key === job.key)) continue;
      job.start();
    }
  }
}

module.exports = new JobSet;
