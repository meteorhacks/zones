function hijackConnection(original, type) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    if(args.length) {
      var callback = args[args.length - 1];
      if(typeof callback === 'function') {
        var ownerInfo = {
          type: type,
          name: args[0],
          args: args.slice(1, args.length - 1)
        };
        args[args.length - 1] = zone.bind(callback, false, ownerInfo, pickAllArgs);
      }
    }
    return original.apply(this, args);
  }
}

function hijackSubscribe(originalFunction, type) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    if(args.length) {
      var callback = args[args.length - 1];
      if(typeof callback === 'function') {
        var ownerInfo = {
          type: type,
          name: args[0],
          args: args.slice(1, args.length - 1)
        };
        args[args.length - 1] = zone.bind(callback, false, ownerInfo, pickAllArgs);
      } else if(callback) {
        ['onReady', 'onError'].forEach(function (funName) {
          var ownerInfo = {
            type: type,
            name: args[0],
            args: args.slice(1, args.length - 1),
            callbackType: funName
          };
          if(typeof callback[funName] === "function") {
            callback[funName] = zone.bind(callback[funName], false, ownerInfo, pickAllArgs);
          }
        })
      }
    }
    return originalFunction.apply(this, args);
  }
}

function hijackCursor(Cursor) {

  hijackFunction('observe', [
    'added', 'addedAt', 'changed', 'changedAt',
    'removed', 'removedAt', 'movedTo'
  ]);

  hijackFunction('observeChanges', [
    'added', 'addedBefore', 'changed',
    'removed', 'movedBefore'
  ]);

  function hijackFunction(type, callbacks) {
    var original = Cursor[type];
    Cursor[type] = function (options) {
      var self = this;
      if(options) {
        callbacks.forEach(function (funName) {
          var ownerInfo = {
            type: 'MongoCursor.' + type,
            callbackType: funName,
            collection: self.collection.name
          };

          if(typeof options[funName] === 'function') {
            options[funName] = zone.bind(options[funName], false, ownerInfo, pickAllArgs);
          }
        });
      }
      return original.call(this, options);
    };
  }
}

function hijackDomRangeOn(original) {
  return function (events, selector, handler) {
    if(handler && typeof handler === 'function') {
      var newHandler = function () {
        zone.owner = {type: 'domEvent', events: events, selector: selector};
        var args = Array.prototype.slice.call(arguments);
        handler.apply(this, args);
      };
    }
    return original.call(this, events, selector, newHandler);
  }
}

var originalFunctions = [];
function backupOriginals(obj, methodNames) {
  if(obj && Array.isArray(methodNames)) {
    var backup = {obj: obj};
    backup.methods = {};
    methodNames.forEach(function (name) {
      backup.methods[name] = obj[name];
    });
    originalFunctions.push(backup);
  };
}

function restoreOriginals() {
  originalFunctions.forEach(function (backup) {
    for(var name in backup.methods) {
      backup.obj[name] = backup.methods[name];
    };
  });
}

function pickAllArgs(context, args) {
  return args;
}
