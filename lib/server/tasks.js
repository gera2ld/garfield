const child_process = require('child_process');
const EventEmitter = require('events');
const logger = require('./logger');
const Logs = require('../logs');
const models = require('../models');

const PENDING = 'pending';
const RUNNING = 'running';
const FINISHED = 'finished';
const ERROR = 'error';

function debounce(func, time) {
  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }
  function exec(thisObj, args) {
    cancel();
    func.apply(thisObj, args);
  }
  let timer;
  return function (...args) {
    cancel();
    timer = setTimeout(exec, time, this, args);
  };
}

class Task extends EventEmitter {
  constructor(task) {
    super();
    this.task = task;
    this.logs = new Logs(task.logData || {});
    this.saveLater = debounce(() => this.task.save(), 500);
  }

  get id() {
    return this.task.id;
  }

  start() {
    logger.info(`Exec: ${command}`);
    this.update({
      status: RUNNING,
      startedAt: new Date,
    });
    const child = this.child = child_process.exec('sh', {
      cwd: data.cwd,
      env: Object.assign({}, process.env, data.env),
      timeout: data.timeout,
    }, (err, stdout, stderr) => {
      this.child = null;
      const endedAt = new Date;
      if (err) {
        logger.error(`Aborted: ${command}`);
        logger.error(`  error: ${err}`);
        this.update({
          endedAt,
          status: ERROR,
          error: err.toString(),
        });
      } else {
        logger.info(`Finished: ${command}`);
        this.update({
          endedAt,
          status: FINISHED,
        });
      }
      this.emit('end');
    });
    let {script} = this.task;
    if (!script.endsWith('\n')) script += '\n';
    child.stdin.write(script);
    child.stdin.end();
    child.stdout.on('data', this.getLogger('out'));
    child.stderr.on('data', this.getLogger('err'));
    return child;
  }

  update(data, emit=true) {
    emit && this.emit('change', this, data);
    Object.assign(this.task, data);
    this.saveLater();
  }

  getLogger(type) {
    return chunk => this.log(chunk, type);
  }

  log(chunk, type) {
    this.hasLogs = true;
    this.emit('log', this, this.logs.write(chunk, type));
    this.task.logData = this.logs.getValue();
    this.update({log: JSON.stringify(this.task.logData)}, false);
  }
}

class Executor extends EventEmitter {
  constructor(maxConcurrency) {
    super();
    this.maxConcurrency = maxConcurrency || 1;
    this.queue = [];
    this.run = this.run.bind(this);
  }

  runOne() {
    const promise = model.Tasks.objects.get({
      where: {
        status: PENDING,
      },
    })
    .then(data => new Promise(resolve => {
      if (!data) return setTimeout(resolve, 1000);
      const task = new Task(data);
      task.on('change', task => {
        this.emit('update', task);
        [FINISHED, ERROR].includes(task.status) && resolve();
      });
      task.on('log', (task, chunk) => this.emit('log', task, chunk));
      task.start();
    }))
    .then(() => {
      const i = this.queue.findIndex(promise);
      ~i && this.queue.splice(i, 1);
    });
    this.queue.push(promise);
    return promise;
  }

  run() {
    while (this.queue.length < this.maxConcurrency) {
      this.runOne().then(this.run);
    }
  }
}

module.exports = new Executor;
