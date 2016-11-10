const path = require('path');
const child_process = require('child_process');
const EventEmitter = require('events');
const logger = require('./logger');
const Logs = require('../utils/logs');
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

  getEnv({command, project}) {
    return Object.assign({}, process.env, {
      PROJECT_NAME: project.name,
    });
  }

  start() {
    this.task.getCommand()
    .then(command => command ? command.getProject().then(project => ({command, project})) : {})
    .then(({command, project}) => new Promise((resolve, reject) => {
      if (!command || !project) reject('Invalid command!');
      const commandKey = `[${command.id}] ${command.desc}`;
      logger.info(`Exec: ${commandKey}`);
      this.update({
        status: RUNNING,
        startedAt: new Date,
      });
      const child = this.child = child_process.spawn('sh', {
        cwd: process.env.DATA_DIR,
        env: this.getEnv({command, project}),
        detached: true,
      });
      child.stdout.on('data', this.getLogger('out'));
      child.stderr.on('data', this.getLogger('err'));
      child.on('error', err => {
        this.setTimer();
        reject({key: commandKey, err});
      });
      child.on('close', code => {
        this.setTimer();
        if (code) {
          reject({key: commandKey, err: `Exited with code: ${code}`});
        }
        resolve({key: commandKey});
      });
      let {script, timeout=10 * 60 * 1000} = command;
      if (!script.endsWith('\n')) script += '\n';
      child.stdin.write(script);
      child.stdin.end();
      this.setTimer(() => {
        this.log('\nTimed out, killed by web-commander.\n', 'err');
        process.kill(-child.pid);
        reject({key: commandKey, err: 'timed out'});
      }, timeout);
    }))
    .then(({key}) => {
      logger.info(`Finished: ${key}`);
      return {
        status: FINISHED,
      };
    }, ({key, err}) => {
      logger.error(`Aborted: ${key}`);
      logger.error(`  error: ${err}`);
      return {
        status: ERROR,
        error: err.toString(),
      };
    })
    .then(res => {
      res.endedAt = new Date;
      this.child = null;
      this.update(res);
      this.emit('end');
    });
  }

  setTimer(callback, timeout) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (timeout && callback) {
      this.timer = setTimeout(callback, timeout);
    }
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
