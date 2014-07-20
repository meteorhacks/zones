function hijackConnection(original, type) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    if(args.length) {
      var callback = args[args.length - 1];
      if(typeof callback === 'function') {
        args[args.length - 1] = bindWithOwnerInfo(callback, {type: type});
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
        var ownerInfo = {type: type}
        args[args.length - 1] = bindWithOwnerInfo(callback, ownerInfo);
      } else if(callback) {
        ['onReady', 'onError'].forEach(function (funName) {
          if(typeof callback[funName] === "function") {
            var ownerInfo = {type: type, callbackType: funName};
            callback[funName] = bindWithOwnerInfo(callback[funName], ownerInfo);
          }
        })
      }
    }
    return originalFunction.apply(this, args);
  }
}

function hijackCursor(original, type) {
  return function (options) {
    var self = this;
    if(options) {
      [
        'added', 'addedAt', 'changed', 'changedAt',
        'removed', 'removedAt', 'movedTo'
      ].forEach(function (funName) {
        var ownerInfo = {type: type, callbackType: funName};
        if(typeof options[funName] === 'function') {
          options[funName] = bindWithOwnerInfo(options[funName], ownerInfo);
        }
      });
    }
    return original.call(this, options);
  };
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

function bindWithOwnerInfo(func, ownerInfo) {
  var zone = window.zone.fork();
  zone.setOwner(ownerInfo);

  return function zoneBoundFn() {
    zone.setOwnerArgs(arguments);
    return zone.run(func, this, arguments);
  };
}
