function hijackConnection(original, type) {
  return function () {
    var self = this;
    var args = Array.prototype.slice.call(arguments);

    // if this comes from a Method.call we don't need to track it
    var isFromCall = Zone.fromCall.get();

    if(!isFromCall && args.length) {
      var callback = args[args.length - 1];
      if(typeof callback === 'function') {
        var methodName = args[0];
        var methodArgs = args.slice(1, args.length - 1);
        var ownerInfo = {type: type, name: methodName, args: methodArgs};
        args[args.length - 1] = function (argument) {
          var args = Array.prototype.slice.call(arguments);
          var zoneInfo = {type: type, name: methodName, args: methodArgs};
          zone.setInfo(type, zoneInfo);
          return callback.apply(this, args);
        }
        args[args.length - 1] = zone.bind(args[args.length - 1], false, ownerInfo, pickAllArgs);
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
      var subName = args[0];
      var subArgs = args.slice(1, args.length - 1);
      if(typeof callback === 'function') {
        var ownerInfo = {type: type, name: subName, args: subArgs};
        args[args.length - 1] = function (argument) {
          var args = Array.prototype.slice.call(arguments);
          var zoneInfo = {type: type, name: subName, args: subArgs};
          zone.setInfo(type, zoneInfo);
          return callback.apply(this, args);
        }
        args[args.length - 1] = zone.bind(args[args.length - 1], false, ownerInfo, pickAllArgs);
      } else if(callback) {
        ['onReady', 'onError'].forEach(function (funName) {
          var ownerInfo = {type: type, name: subName, args: subArgs, callbackType: funName};
          if(typeof callback[funName] === "function") {
            callback[funName] = function (argument) {
              var args = Array.prototype.slice.call(arguments);
              var zoneInfo = {type: type, name: subName, args: subArgs, callbackType: funName};
              zone.setInfo(type, zoneInfo);
              return callback.apply(this, args);
            }
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

      if(!this._avoidZones && !isFromObserve && options) {
        callbacks.forEach(function (funName) {
          var callback = options[funName];
          if(typeof callback === 'function') {
            var ownerInfo = {
              type: 'MongoCursor.' + type,
              callbackType: funName,
              collection: self.collection.name
            };
            options[funName] = function () {
              var args = Array.prototype.slice.call(arguments);
              var zoneInfo = {
                type: 'MongoCursor.' + type,
                callbackType: funName,
                collection: self.collection.name
              };
              zone.setInfo(type, zoneInfo);
              return callback.apply(this, args);
            }
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
  var type = 'Template.event';
  return function (dict) {
    var self = this;
    var name = this.__templateName || this.kind.split('_')[1];
    for (var target in dict) {
      dict[target] = prepareHandler(dict[target], target);
    }

    return original.call(this, dict);

    function prepareHandler(handler, target) {
      return function () {
        var args = Array.prototype.slice.call(arguments);
        var ownerInfo = {type: type, event: target, template: name};
        zone.owner = ownerInfo;
        var zoneInfo = {type: type, event: target, template: name};
        zone.setInfo(type, zoneInfo);
        handler.apply(this, args);
      };
    }

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

var TemplateCoreFunctions = ['prototype', '__makeView', '__render'];

function hijackTemplateHelpers(template, templateName) {
  _.each(template, function (hookFn, name) {
    template[name] = hijackHelper(hookFn, name, templateName);
  });
}

function hijackNewTemplateHelpers(original, templateName) {
  return function (dict) {
    dict && _.each(dict, function (hookFn, name) {
      dict[name] = hijackHelper(hookFn, name, templateName);
    });

    var args = Array.prototype.slice.call(arguments);
    return original.apply(this, args);
  }
}

function hijackHelper(hookFn, name, templateName) {
  if(hookFn
    && typeof hookFn === 'function'
    && _.indexOf(TemplateCoreFunctions, name) === -1) {
    // Assuming the value is a template helper
    return function () {
      var args = Array.prototype.slice.call(arguments);
      zone.setInfo('Template.helper', {name: name, template: templateName});
      var result = hookFn.apply(this, args);
      if(result && typeof result.observe === 'function') {
        result._avoidZones = true;
      }
      return result;
    }
  } else {
    return hookFn;
  }
}

function hijackGlobalHelpers(helpers) {
  var _ = Package.underscore._;
  _(helpers || {}).each(function (helperFn, name) {
    helpers[name] = hijackGlobalHelper(helperFn, name)
  });
}

function hijackGlobalHelper(helperFn, name) {
  var _ = Package.underscore._;
  if(helperFn
    && typeof helperFn === 'function'
    && _.indexOf(TemplateCoreFunctions, name) === -1) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      zone.setInfo('Global.helper', {name: name});
      var result = helperFn.apply(this, args);
      if(result && typeof result.observe === 'function') {
        result._avoidZones = true;
      }
      return result;
    }
  } else {
    return helperFn;
  }
}

//--------------------------------------------------------------------------\\

var routerEvents = [
  'onRun', 'onData', 'onBeforeAction', 'onAfterAction', 'onStop', 'waitOn',
  'load', 'before', 'after', 'unload',
  'data', 'waitOn'
];

function hijackRouterConfigure(original, type) {
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
            name: this.route.name,
            path: this.path
          });
          zone.setInfo('irHook', {
            name: this.route.name,
            hook: hookName,
            path: this.path
          });
          return hookFn.apply(this, args);
        }
      }
    });
    return original.apply(this, args);
  }
}

function hijackRouterGlobalHooks(Router, type) {
  routerEvents.forEach(function (hookName) {
    var hookFn = Router[hookName];
    /**
     * Example
     * Router.onBeforeAction( handler-function, options )
     */
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
            name: this.route.name,
            path: this.path
          });
          zone.setInfo('irHook', {
            name: this.route.name,
            hook: hookName,
            path: this.path
          });
          return hook.apply(this, args);
        }
      }
      return hookFn.apply(this, args);
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
          zone.addEvent({
            type: type,
            hook: hookName,
            name: this.route.name,
            path: this.path
          });
          zone.setInfo('irHook', {
            name: this.route.name,
            hook: hookName,
            path: this.path
          });
          return hookFn.apply(this, args);
        }
      }
    });

    return original.apply(this, args);
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
            name: this.route.name,
            path: this.path
          });
          zone.setInfo('irHook', {
            name: this.route.name,
            hook: hookName,
            path: this.path
          });
          return hookFn.apply(this, args);
        }
      }
    });
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
