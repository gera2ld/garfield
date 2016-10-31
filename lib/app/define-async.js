!function (root) {
  var define = root.define;
  var use = define.use;
  var queue = [];

  define.async = function (name, data) {
    var gotScript = typeof data === 'function'
    ? Promise.resolve(data())
    : fetch(data).then(function (res) {return res.text();});
    var promise = gotScript
    .then(function (text) {
      define(name, new Function('require', 'exports', 'module', text));
    });
    queue.push(promise);
    return promise;
  };

  define.use = function () {
    var args = arguments;
    return Promise.all(queue)
    .then(function () {
      queue = [];
      use.apply(null, args);
    });
  };
}(this);
