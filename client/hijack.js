
var ConnectionProto = getConnectionProto();

/*
 * Hijack method calls
 */
var original_Connection_apply = ConnectionProto.apply;
ConnectionProto.apply = function (name, args, options, callback) {
  if(typeof callback === 'function') {
    callback = zone.bind(callback);
    original_Connection_apply.call(this, name, args, options, callback);
  } else if(!callback && typeof options === 'function') {
    // 3 arguments (name, args, callback)
    callback = zone.bind(options);
    original_Connection_apply.call(this, name, args, callback);
  } else {
    // 3 arguments (name, args, options)
    callback = zone.bind(Function());
    original_Connection_apply.call(this, name, args, options, callback);
  }
}

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
