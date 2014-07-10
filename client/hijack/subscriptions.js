
var ConnectionProto = getConnectionProto();

ConnectionProto.subscribe = hijackedSubscribe(ConnectionProto.subscribe);

Meteor.subscribe = hijackedSubscribe(Meteor.subscribe);

function hijackedSubscribe (originalFunction) {
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
          };
        });
      }
      originalFunction.apply(this, args);
    }
  }
}
