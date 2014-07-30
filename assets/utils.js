function hijackConnection(original, type) {
  return function () {
    var self = this;
    var args = Array.prototype.slice.call(arguments);

    // if this comes from a Method.call we don't need to track it
    var isFromCall = Zone.fromCall.get();

    if(!isFromCall && args.length) {
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

    if(type == "Meteor.call") {
      // make sure this won't get tracked another time
      return Zone.fromCall.withValue(true, function() {
        return original.apply(self, args);
      });
    } else {
      return original.apply(this, args);
    }
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
      // check this request comes from an observer call
      // if so, we don't need to track this request
      var isFromObserve = Zone.fromObserve.get();

      if(!isFromObserve && options) {
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

      if(type == 'observe') {
        // notify observeChanges to not to track again
        return Zone.fromObserve.withValue(true, function() {
          return original.call(self, options);
        });
      } else {
        return original.call(this, options);
      }
    };
  }
}

function hijackComponentEvents(original) {
  return function (dict) {
    var self = this;
    var name = this.__templateName;
    for (var target in dict) {
      dict[target] = prepareHandler(dict[target], target);
    }

    return original.call(this, dict);

    function prepareHandler(handler, target) {
      return function () {
        var args = Array.prototype.slice.call(arguments);
        zone.owner = {
          type: 'Template.event',
          event: target,
          template: name
        };
        handler.apply(this, args);
      };
    }

  }
}

function hijackTemplateRendered(original, name) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    zone.addEvent({type: 'Template.rendered', template: name});
    return original.apply(this, args);
  }
}

function hijackDepsFlush(original, type) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    if(zone.owner && window.zone.owner.type == 'setTimeout') {
      zone.owner = {type: type};
    }
    return original.apply(this, args);
  }
}

function hijackSessionSet(original, type) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    zone.addEvent({type: type, key: args[0], value: args[1]});
    return original.apply(this, args);
  }
}

//--------------------------------------------------------------------------\\

var routerEvents = [
  'onRun', 'onData', 'onBeforeAction', 'onAfterAction', 'onStop', 'waitOn',
  'load', 'before', 'after', 'unload',
];

function hijackRouterConfigure(original, type) {
  return function (dict) {
    var args = Array.prototype.slice.call(arguments);
    dict && routerEvents.forEach(function (hookName) {
      var hookFn = dict[hookName];
      if(typeof hookFn === 'function') {
        dict[hookName] = function () {
          var args = Array.prototype.slice.call(arguments);
          zone.addEvent({
            type: type,
            hook: hookName,
            path: this.path
          });
          hookFn.apply(this, args);
        }
      }
    });
    return original.apply(this, args);
  }
}

function hijackRouterGlobalHooks(Router, type) {
  routerEvents.forEach(function (hookName) {
    var hookFn = Router[hookName];
    Router[hookName] = function (hook, options) {
      var args = Array.prototype.slice.call(arguments);
      var hook = args[0];
      if(hook && typeof hook === 'function') {
        // override hook function before sending to iron-router
        args[0] = function () {
          var args = Array.prototype.slice.call(arguments);
          zone.addEvent({
            type: type,
            hook: hookName,
            path: this.path
          });
          hook.apply(this, args);
        }
      }
      hookFn.apply(this, args);
    }
  });

  return Router;
}

function hijackRouterOptions(original, type) {
  return function (name, options) {
    var args = Array.prototype.slice.call(arguments);

    // hijack options
    options && routerEvents.forEach(function (hookName) {
      var hookFn = options[hookName];
      if(typeof hookFn === 'function') {
        options[hookName] = function () {
          var args = Array.prototype.slice.call(arguments);
          console.log('-- this', this)
          zone.addEvent({
            type: type,
            hook: hookName,
            path: this.path
          });
          hookFn.apply(this, args);
        }
      }
    });

    original.apply(this, args);
  }
}

function hijackRouteController(original, type) {
  return function (options) {
    var args = Array.prototype.slice.call(arguments);
    options && routerEvents.forEach(function (hookName) {
      var hookFn = options[hookName];
      if(typeof hookFn === 'function') {
        options[hookName] = function () {
          var args = Array.prototype.slice.call(arguments);
          zone.addEvent({
            type: type,
            hook: hookName,
            path: this.path
          });
          hookFn.apply(this, args);
        }
      }
    });
    zone.addEvent({type: type});
    return original.apply(this, args);
  }
}

//--------------------------------------------------------------------------\\

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
