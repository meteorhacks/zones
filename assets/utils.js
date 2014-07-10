function hijackConnection(original) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    if(args.length) {
      var callback = args[args.length - 1];
      if(typeof callback === 'function') {
        args[args.length - 1] = zone.bind(callback);
        original.apply(this, args);
      }
    }
  }
}

function hijackSubscribe(originalFunction) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    if(args.length) {
      var callback = args[args.length - 1];
      if(typeof callback === 'function') {
        args[args.length - 1] = zone.bind(callback);
      } else if(callback) {
        ['onReady', 'onError'].forEach(function (funName) {
          if(typeof callback[funName] === "function") {
            callback[funName] = zone.bind(callback[funName]);
          }
        })
      }
      originalFunction.apply(this, args);
    }
  }
}

function hijackCursor(original) {
  return function (options) {
    if(options) {
      [
        'added', 'addedAt', 'changed', 'changedAt',
        'removed', 'removedAt', 'movedTo'
      ].forEach(function (funName) {
        if(typeof options[funName] === 'function') {
          options[funName] = zone.bind(options[funName]);
        };
      });
    }
    original.call(this, options);
  };
}
