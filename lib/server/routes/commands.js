const Router = require('koa-router');
const commands = require('../../commands');
const logger = require('../logger');

const router = new Router({
  prefix: '/cmd',
})
.post('/:name/:type', function* (next) {
  const {name, type} = this.params;
  const res = yield commands.run(name, type, this.request.body) || {status: 404};
  logger.info(`${res.status} ${res.body || '-'} <${this.ip}>`);
  this.status = res.status;
  if (res.body) this.body = res.body;
});

module.exports = router.routes();
