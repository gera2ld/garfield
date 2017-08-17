import childProcess from 'child_process';
import EventEmitter from 'events';
import { debounce } from 'lodash';
import Logs from '#/common/logs';
import config from '../config';
import { getLogger, consts } from '../utils';
import models from '../models';

const logger = getLogger('task');

class Task extends EventEmitter {
  constructor(task) {
    super();
    this.task = task;
    this.logs = new Logs(task.logData || {});
    this.saveLater = debounce(this.save, 500, { maxWait: 10000 });
  }

  get id() {
    return this.task.id;
  }

  static getEnv({ project }) {
    return Object.assign({}, process.env, {
      PROJECT_NAME: project.name,
    });
  }

  async start() {
    const task = await this.task.reload({
      include: [
        {
          model: models.Command,
          include: [
            { model: models.Project },
          ],
        },
      ],
    });
    if (!task.command || !task.command.project) {
      throw 'Invalid command!';
    }
    const { command } = task;
    const { project } = command;
    const commandKey = `[${command.id}] ${command.desc}`;
    logger.info(`Exec: ${commandKey}`);
    this.update({
      status: consts.RUNNING,
      startedAt: new Date(),
    });
    let result;
    try {
      await new Promise((resolve, reject) => {
        const child = childProcess.spawn('sh', {
          cwd: config.get('DATA_DIR'),
          env: Task.getEnv({ command, project }),
          detached: true,
        });
        this.child = child;
        child.stdout.on('data', this.getLogger('out'));
        child.stderr.on('data', this.getLogger('err'));
        child.on('error', err => {
          this.setTimer();
          reject(err);
        });
        child.on('close', code => {
          this.setTimer();
          if (code) {
            reject(`Exited with code: ${code}`);
          }
          resolve();
        });
        const { script, timeout = 10 * 60 * 1000 } = command;
        child.stdin.write(`${script}\n`);
        child.stdin.end();
        this.setTimer(() => {
          this.log('\nTimed out, killed by Garfield.\n', 'err');
          process.kill(-child.pid);
          reject('timed out');
        }, timeout);
      });
      logger.info(`Finished: ${commandKey}`);
      result = { status: consts.FINISHED };
    } catch (err) {
      logger.error(`Aborted: ${commandKey}`);
      logger.error(`  error: ${err}`);
      result = {
        status: consts.ERROR,
        error: err.toString(),
      };
    }
    result.endedAt = new Date();
    this.child = null;
    this.update(result);
    this.emit('end');
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

  update(data, emit = true) {
    Object.assign(this.task, data);
    if (emit) this.emit('change', this.task, data);
    this.saveLater();
  }

  getLogger(type) {
    return chunk => this.log(chunk, type);
  }

  log(chunk, type) {
    this.hasLogs = true;
    this.emit('log', this.task, this.logs.write(chunk, type));
    this.task.logData = this.logs.getValue();
    this.update({ log: this.task.logData }, false);
  }

  save = async () => {
    await this.task.save();
  }
}

class Executor extends EventEmitter {
  constructor(maxConcurrency) {
    super();
    this.maxConcurrency = maxConcurrency || 1;
    this.queue = [];
    this.ready = Executor.resetRunning();
  }

  static async popQueue(size = 1) {
    const tasks = await models.Task.findAll({
      where: {
        status: consts.PENDING,
      },
      limit: size,
    });
    if (tasks.length) {
      await models.Task.update({
        status: consts.RUNNING,
      }, {
        where: {
          id: {
            $in: tasks.map(task => task.id),
          },
        },
      });
    }
    return tasks;
  }

  runOne = data => {
    const promise = new Promise(resolve => {
      const task = new Task(data);
      task.on('change', (taskData, changed) => {
        this.emit('update', taskData, changed);
        if ([
          consts.FINISHED,
          consts.ERROR,
        ].includes(taskData.status)) resolve(true);
      });
      task.on('log', (taskData, chunk) => this.emit('log', taskData, chunk));
      task.start();
    })
    .then(checkMore => {
      const i = this.queue.indexOf(promise);
      if (i >= 0) this.queue.splice(i, 1);
      if (checkMore) this.safeRun();
    });
    this.queue.push(promise);
    return promise;
  }

  run = () => {
    const limit = this.maxConcurrency - this.queue.length;
    if (limit <= 0) return;
    return Executor.popQueue(limit)
    .then(tasks => {
      tasks.forEach(this.runOne);
    });
  }

  safeRun = () => {
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
      if (this.nextRun) setTimeout(this.safeRun, 3000);
    });
  }

  static resetRunning() {
    // Reset running tasks since they are exited accidentally
    return models.Task.update({
      status: consts.PENDING,
    }, {
      where: {
        status: consts.RUNNING,
      },
    });
  }
}

export default new Executor();
