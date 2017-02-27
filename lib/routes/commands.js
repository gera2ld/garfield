const Router = require('koa-router');
const commands = require('../server/commands');
const {getLogger} = require('../utils');
const logger = getLogger('command');

const router = new Router({
  prefix: '/cmd',
})
.post('/:name/:type', async function (ctx, next) {
  const {name, type} = ctx.params;
  const res = await commands.run(name, type, ctx.request.body) || {status: 404};
  logger.info(`${res.status} ${res.body || '-'} <${ctx.ip}>`);
  ctx.status = res.status;
  if (res.body) ctx.body = res.body;
});

module.exports = router.routes();
