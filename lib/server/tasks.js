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
    this.task.getCommand()
    .then(command => new Promise((resolve, reject) => {
      if (!command) return reject('Invalid command!');
      const commandKey = `[${command.id}] ${command.desc}`;
      logger.info(`Exec: ${commandKey}`);
      this.update({
        status: RUNNING,
        startedAt: new Date,
      });
      const child = this.child = child_process.exec('sh', {
        env: Object.assign({}, process.env),
      }, (err, stdout, stderr) => {
        if (err) {
          logger.error(`Aborted: ${commandKey}`);
          logger.error(`  error: ${err}`);
          reject(err);
        } else {
          logger.info(`Finished: ${commandKey}`);
          resolve();
        }
      });
      let {script} = command;
      if (!script.endsWith('\n')) script += '\n';
      child.stdin.write(script);
      child.stdin.end();
      child.stdout.on('data', this.getLogger('out'));
      child.stderr.on('data', this.getLogger('err'));
    }))
    .then(() => ({
      status: FINISHED,
    }), err => ({
      status: ERROR,
      error: err.toString(),
    }))
    .then(res => {
      res.endedAt = new Date;
      this.child = null;
      this.update(res);
      this.emit('end');
    });
  }

  update(data, emit=true) {
    Object.assign(this.task, data);
    emit && this.emit('change', this.task, data);
    this.saveLater();
  }

  getLogger(type) {
    return chunk => this.log(chunk, type);
  }

  log(chunk, type) {
    this.hasLogs = true;
    this.emit('log', this.task, this.logs.write(chunk, type));
    this.task.logData = this.logs.getValue();
    this.update({log: JSON.stringify(this.task.logData)}, false);
  }
}

class Executor extends EventEmitter {
  constructor(maxConcurrency) {
    super();
    this.maxConcurrency = maxConcurrency || 1;
    this.queue = [];
    this.ready = this.resetRunning();
    [
      'run',
      'runOne',
      'safeRun',
    ].forEach(name => this[name] = this[name].bind(this));
  }

  popQueue(size=1) {
    return models.Task.objects.findAll({
      where: {
        status: PENDING,
      },
      limit: size,
    })
    .then(tasks => {
      return (tasks.length
        ? models.Task.update({
          status: RUNNING,
        }, {
          where: {
            id: {
              $in: tasks.map(task => task.id),
            },
          },
        })
        : Promise.resolve())
      .then(() => tasks);
    });
  }

  runOne(data) {
    const promise = new Promise(resolve => {
      const task = new Task(data);
      task.on('change', (taskData, changed) => {
        this.emit('update', taskData, changed);
        [FINISHED, ERROR].includes(taskData.status) && resolve(true);
      });
      task.on('log', (taskData, chunk) => this.emit('log', taskData, chunk));
      task.start();
    })
    .then(checkMore => {
      const i = this.queue.indexOf(promise);
      ~i && this.queue.splice(i, 1);
      checkMore && this.safeRun();
    });
    this.queue.push(promise);
    return promise;
  }

  run() {
    const limit = this.maxConcurrency - this.queue.length;
    if (limit <= 0) return;
    return this.popQueue(limit)
    .then(tasks => {
      tasks.forEach(this.runOne);
    });
  }

  safeRun() {
    if (this.running) {
      this.nextRun = true;
      return;
    }
    this.nextRun = false;
    this.running = true;
    this.ready = this.ready
    .then(this.run)
    .then(() => {
      this.running = false;
      this.nextRun && setTimeout(this.safeRun, 3000);
    });
  }

  resetRunning() {
    // Reset running tasks since they are exited accidentally
    return models.Task.update({
      status: PENDING,
    }, {
      where: {
        status: RUNNING,
      },
    });
  }
}

module.exports = new Executor;
