import Router from 'koa-router';
import models from '../models';
import { consts } from '../utils';

function Lock() {
  let promise;
  let release;
  return {
    async acquire() {
      if (promise) await promise;
      promise = new Promise(resolve => {
        release = resolve;
      });
    },
    release() {
      if (release) {
        release();
      }
    },
  };
}

const lock = Lock();

const router = new Router({
  prefix: '/task',
})
.post('/pop', async ctx => {
  await lock.acquire();
  const task = await models.Task.findOne({
    where: {
      status: consts.PENDING,
    },
  });
  if (task) {
    const salt = Math.random().toString(36).slice(2, 10);
    await task.update({
      status: consts.RUNNING,
      salt,
    });
  }
  lock.release();
  ctx.body = task ? task.toJSON() : null;
});

export default router.routes();
