exports.list = function list(Model, options={}) {
  options = Object.assign({
    per: 25,
    page: 1,
  }, options);
  return function* () {
    const {per=options.per, page=options.page} = this.query;
    const params = {
      offset: per * (page - 1),
      limit: per,
    };
    const where = options.where && options.where(this.query, this.params);
    if (where) params.where = where;
    [
      'include',
      'order',
    ].forEach(key => {
      if (options[key]) params[key] = options[key];
    });
    const data = yield Model.findAndCountAll(params);
    data.currentPage = page;
    let pages = ~~ (data.count / per);
    if (pages * per < data.count) pages ++;
    data.totalPages = pages;
    this.body = data;
  };
};

function createModel(Model, data) {
  return Model.create(data);
}

exports.create = function create(Model, options={}) {
  const {handle=createModel} = options;
  return function* () {
    const data = this.request.body;
    if (!data) return this.status = 400;
    const model = yield handle(Model, data);
    this.body = model;
  };
};

exports.retrieve = function retrieve(Model, options={}) {
  const {key='id'} = options;
  return function* () {
    const id = this.params[key];
    const model = yield Model.findById(id);
    if (!model) return this.status = 404;
    this.body = model;
  };
};

function updateModel(model, data) {
  return model.update(data);
}

exports.update = function update(Model, options={}) {
  const {key='id', handle=updateModel} = options;
  return function* () {
    const id = this.params[key];
    const data = this.request.body;
    if (!data) return this.status = 400;
    const model = yield Model.findById(id);
    if (!model) return this.status = 404;
    this.body = yield handle(model, data);
  };
};

function removeModel(model) {
  return model.destroy();
}

exports.remove = function remove(Model, options={}) {
  const {key='id', handle=removeModel} = options;
  return function* () {
    const id = this.params[key];
    const model = yield Model.findById(id);
    if (!model) return this.status = 404;
    yield handle(model);
    this.body = null;
  };
};

exports.withParent = function withParent(ParentModel, options={}) {
  const {key='id'} = options;
  return function (handle) {
    return function* (next) {
      const id = this.params[key];
      const parent = yield ParentModel.findById(id);
      if (!parent) return this.status = 404;
      yield handle.call(this, parent, next);
    };
  };
}
