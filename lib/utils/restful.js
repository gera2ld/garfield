const Router = require('koa-router');
const {wraps} = require('.');

function setError(ctx, status=500, error='Internal Server Error') {
  ctx.status = status;
  ctx.body = {
    error,
  };
}

function getQuery(ctx, query) {
  return typeof query === 'function' ? query(ctx) : query;
}

function whereLike(q, fields) {
  if (q) {
    q = q.replace(/[_%]/g, '');
  }
  if (q) {
    const like = {
      $like: `%${q}%`,
    };
    return fields.reduce((where, key) => {
      where.$or[key] = like;
      return where;
    }, {$or: {}});
  }
  return null;
}

class API {
  constructor({prefix, defaultKey='id', docs=true}) {
    this.prefix = prefix || '';
    this.router = Router({
      prefix,
      strict: true,
    });
    this.defaultKey = defaultKey;
    if (docs) this.docs = [];
  }

  buildMiddlewares(middlewares, getHandler) {
    const options = middlewares.pop();
    if (!options || typeof options !== 'object') {
      if (typeof options === 'function') {
        middlewares.push(options);
      }
      return middlewares;
    }
    middlewares.push(getHandler(options));
    return middlewares;
  }

  addDoc(type, path, middlewares) {
    if (!this.docs) return;
    const method = ({
      getList: 'get',
    }[type] || type).toUpperCase();
    this.docs.push({
      type,
      method,
      path: this.prefix + path,
      middlewares: middlewares.map(middleware => {
        return {
          name: middleware.__name__ || middleware.name,
          doc: middleware.__doc__,
        };
      }),
    });
  }

  getMeta(method, options) {
    const {Model} = options;
    return {
      name: options.name,
      doc: options.doc || Model && `${Model.name}#${method}` || undefined,
    };
  }

  getList(path, ...args) {
    const middlewares = this.buildMiddlewares(args, options => {
      const {Model, query} = options;
      return wraps(async function (ctx, next) {
        const per = +ctx.query.per || +options.per || 25;
        const page = +ctx.query.page || +options.page || 1;
        const params = getQuery(ctx, query) || {};
        params.offset = per * (page - 1);
        params.limit = per;
        const res = await Model.findAndCountAll(params);
        let pages = ~~ (res.count / per);
        if (pages * per < res.count) pages++;
        ctx.body = {
          data: res.rows,
          count: res.count,
          currentPage: page,
          totalPages: pages,
        };
      }, this.getMeta('getList', options));
    });
    this.router.get(path, ...middlewares);
    this.addDoc('getList', path, middlewares);
    return this;
  }

  get(path, ...args) {
    const middlewares = this.buildMiddlewares(args, options => {
      const {key=this.defaultKey, Model, query} = options;
      return wraps(async function (ctx, next) {
        const id = ctx.params[key];
        const item = await Model.findById(id, getQuery(ctx, query));
        if (!item) return setError(ctx, 404, 'Not found');
        ctx.body = {
          data: item.toJSON(),
        };
      }, this.getMeta('get', options));
    });
    this.router.get(path, ...middlewares);
    this.addDoc('get', path, middlewares);
    return this;
  }

  _patch(method, path, ...args) {
    const middlewares = this.buildMiddlewares(args, options => {
      const {key=this.defaultKey, Model, getData, query, after} = options;
      return wraps(async function (ctx, next) {
        const id = ctx.params[key];
        const {body} = ctx.request;
        let updates = body;
        if (getData) updates = getData(body, ctx);
        const item = await Model.findById(id, getQuery(ctx, query));
        if (!item) return setError(ctx, 404, 'Not found');
        await item.update(updates);
        if (after) await after(body, ctx, item);
        ctx.body = {
          data: item.toJSON(),
        };
      }, this.getMeta(method, options));
    });
    this.router[method](path, ...middlewares);
    this.addDoc(method, path, middlewares);
    return this;
  }

  patch(...args) {
    return this._patch('patch', ...args);
  }

  put(...args) {
    return this._patch('put', ...args);
  }

  post(path, ...args) {
    const middlewares = this.buildMiddlewares(args, options => {
      const {Model, getData, query, after} = options;
      return wraps(async function (ctx, next) {
        const {body} = ctx.request;
        let data = body;
        if (getData) data = getData(body, ctx);
        const item = await Model.create(data, getQuery(ctx, query));
        if (after) await after(body, ctx, item);
        ctx.status = 201;
        ctx.body = {
          data: item.toJSON(),
        };
      }, this.getMeta('post', options));
    });
    this.router.post(path, ...middlewares);
    this.addDoc('post', path, middlewares);
    return this;
  }

  delete(path, ...args) {
    const middlewares = this.buildMiddlewares(args, options => {
      const {key=this.defaultKey, Model} = options;
      return wraps(async function (ctxnext) {
        const id = ctx.params[key];
        await Model.destroy({
          where: {id},
        });
        ctx.body = null;
      }, this.getMeta('delete', options));
    });
    this.router.delete(path, ...middlewares);
    this.addDoc('delete', path, middlewares);
    return this;
  }

  buildDocs() {
    const {docs} = this;
    this.router
    .get('/_docs/', function (ctx, next) {
      ctx.set('Content-Type', 'text/html; charset=utf-8');
      ctx.body = require('fs').createReadStream(__dirname + '/../static/index.html', 'utf8');
    })
    .get('/_docs/items', function (ctx, next) {
      ctx.body = {
        data: docs,
      };
    });
  }

  routes() {
    this.docs && this.buildDocs();
    return this.router.routes();
  }
}

exports.API = API;
exports.whereLike = whereLike;
