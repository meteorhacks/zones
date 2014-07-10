
var ConnectionProto = getConnectionProto();
var originalFunction = ConnectionProto.apply;

ConnectionProto.apply = function (name, args, options, callback) {
  if(typeof callback === 'function') {
    callback = zone.bind(callback);
    originalFunction.call(this, name, args, options, callback);
  } else if(!callback && typeof options === 'function') {
    // 3 arguments (name, args, callback)
    callback = zone.bind(options);
    originalFunction.call(this, name, args, callback);
  } else {
    // 3 arguments (name, args, options)
    callback = zone.bind(Function());
    originalFunction.call(this, name, args, options, callback);
  }
}

function getConnectionProto () {
  var con = DDP.connect(window.location.origin);
  con.disconnect();
  var proto = con.constructor.prototype;
  return proto;
}
