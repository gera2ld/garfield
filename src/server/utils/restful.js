import fs from 'fs';
import Router from 'koa-router';
import { wraps, setError } from './helpers';

function getQuery(ctx, query) {
  return typeof query === 'function' ? query(ctx) : query;
}

export function whereLike(q, fields) {
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
    }, { $or: {} });
  }
  return null;
}

function buildMiddlewares(args, getHandler) {
  const middlewares = [...args];
  const options = middlewares.pop();
  if (typeof options === 'function') {
    middlewares.push(options);
  } else if (options && typeof options === 'object') {
    middlewares.push(getHandler(options));
  }
  return middlewares;
}

function getMeta(method, { Model, name, doc }) {
  return {
    name,
    doc: doc || (Model && `${Model.name}#${method}`) || undefined,
  };
}

export class API {
  constructor({ prefix, defaultKey = 'id', docs = true }) {
    this.prefix = prefix || '';
    this.defaultKey = defaultKey;
    this.router = new Router({
      prefix,
      strict: true,
    });
    if (docs) this.docs = [];
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
      middlewares: middlewares.map(middleware => ({
        name: middleware.__name__ || middleware.name,
        doc: middleware.__doc__,
      })),
    });
  }

  getList(path, ...args) {
    const middlewares = buildMiddlewares(args, options => {
      const { Model, query } = options;
      const optionPage = +options.page;
      const optionPer = +options.per;
      return wraps(async ctx => {
        const per = +ctx.query.per || optionPer || 25;
        const page = +ctx.query.page || optionPage || 1;
        const params = getQuery(ctx, query) || {};
        params.offset = per * (page - 1);
        params.limit = per;
        const res = await Model.findAndCountAll(params);
        const pages = Math.ceil(res.count / per);
        ctx.body = {
          data: res.rows,
          count: res.count,
          currentPage: page,
          totalPages: pages,
        };
      }, getMeta('getList', options));
    });
    this.router.get(path, ...middlewares);
    this.addDoc('getList', path, middlewares);
    return this;
  }

  get(path, ...args) {
    const middlewares = buildMiddlewares(args, options => {
      const { key = this.defaultKey, Model, query } = options;
      return wraps(async ctx => {
        const id = ctx.params[key];
        const item = await Model.findById(id, getQuery(ctx, query));
        if (!item) return setError(ctx, 404, 'Not found');
        ctx.body = {
          data: item.toJSON(),
        };
      }, getMeta('get', options));
    });
    this.router.get(path, ...middlewares);
    this.addDoc('get', path, middlewares);
    return this;
  }

  _patch(method, path, ...args) {
    const middlewares = buildMiddlewares(args, options => {
      const { key = this.defaultKey, Model, getData, query, after } = options;
      return wraps(async ctx => {
        const id = ctx.params[key];
        const { body } = ctx.request;
        let updates = body;
        if (getData) updates = getData(body, ctx);
        const item = await Model.findById(id, getQuery(ctx, query));
        if (!item) return setError(ctx, 404, 'Not found');
        await item.update(updates);
        if (after) await after(body, ctx, item);
        ctx.body = {
          data: item.toJSON(),
        };
      }, getMeta(method, options));
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
    const middlewares = buildMiddlewares(args, options => {
      const { Model, getData, query, after } = options;
      return wraps(async ctx => {
        const { body } = ctx.request;
        let data = body;
        if (getData) data = getData(body, ctx);
        const item = await Model.create(data, getQuery(ctx, query));
        if (after) await after(body, ctx, item);
        ctx.status = 201;
        ctx.body = {
          data: item.toJSON(),
        };
      }, getMeta('post', options));
    });
    this.router.post(path, ...middlewares);
    this.addDoc('post', path, middlewares);
    return this;
  }

  delete(path, ...args) {
    const middlewares = buildMiddlewares(args, options => {
      const { key = this.defaultKey, Model } = options;
      return wraps(async ctx => {
        const id = ctx.params[key];
        await Model.destroy({
          where: { id },
        });
        ctx.body = null;
      }, getMeta('delete', options));
    });
    this.router.delete(path, ...middlewares);
    this.addDoc('delete', path, middlewares);
    return this;
  }

  buildDocs() {
    const { docs } = this;
    this.router
    .get('/_docs/', ctx => {
      ctx.set('Content-Type', 'text/html; charset=utf-8');
      ctx.body = fs.createReadStream('static/index.html', 'utf8');
    })
    .get('/_docs/items', ctx => {
      ctx.body = {
        data: docs,
      };
    });
  }

  routes() {
    // if (this.docs) this.buildDocs();
    return this.router.routes();
  }
}
