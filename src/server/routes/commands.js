import Router from 'koa-router';
import { runCommand } from '../app/commands';
import { getLogger } from '../utils';

const logger = getLogger('command');

const router = new Router({
  prefix: '/cmd',
})
.post('/:name/:type', async ctx => {
  const { name, type } = ctx.params;
  let res = await runCommand(name, type, ctx.request.body);
  res = res || { status: 404 };
  logger.info(`${res.status} ${res.body || '-'} <${ctx.ip}>`);
  ctx.status = res.status;
  if (res.body) ctx.body = res.body;
});

export default router.routes();
