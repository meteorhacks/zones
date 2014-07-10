
var ConnectionProto = getConnectionProto();

/*
 * Hijack method calls
 */
var original_Connection_apply = ConnectionProto.apply;
ConnectionProto.apply = function () {
  var args = Array.prototype.slice.call(arguments);
  if(args.length) {
    var callback = args[args.length - 1];
    if(typeof callback === 'function') {
      args[args.length - 1] = zone.bind(callback);
      original_Connection_apply.apply(this, args);
    };
  };
};

/*
 * Hijack DDP subscribe method
 * Used when connecting to external DDP servers
 */
var original_Connection_subscribe = ConnectionProto.subscribe;
ConnectionProto.subscribe = function () {
  var args = Array.prototype.slice.call(arguments);
  if(args.length) {
    var callback = args[args.length - 1];
    if(typeof callback === 'function') {
      args[args.length - 1] = zone.bind(callback);
    } else if(callback) {
      ['onReady', 'onError'].forEach(function (funName) {
        if(typeof callback[funName] === "function") {
          callback[funName] = zone.bind(callback[funName]);
        };
      });
    }
    original_Connection_subscribe.apply(this, args);
  }
}

/**
 * Hijack Meteor.subscribe because Meteor.subscribe binds to
 * Connection.subscribe before the hijack
 */
var original_Meteor_subscribe = Meteor.subscribe;
Meteor.subscribe = function () {
  var args = Array.prototype.slice.call(arguments);
  if(args.length) {
    var callback = args[args.length - 1];
    if(typeof callback === 'function') {
      args[args.length - 1] = zone.bind(callback);
    } else if(callback) {
      ['onReady', 'onError'].forEach(function (funName) {
        if(typeof callback[funName] === "function") {
          callback[funName] = zone.bind(callback[funName]);
        };
      });
    }
    original_Meteor_subscribe.apply(this, args);
  }
}

var original_Cursor_observe = LocalCollection.Cursor.prototype.observe;
LocalCollection.Cursor.prototype.observe = function (options) {
  if(options) {
    ['added', 'addedAt', 'changed', 'changedAt', 'removed', 'removedAt', 'movedTo'].forEach(function (funName) {
      if(typeof options[funName] === 'function') {
        options[funName] = zone.bind(options[funName]);
      };
    });
  }
  original_Cursor_observe.call(this, options);
}

