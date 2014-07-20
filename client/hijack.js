
var ConnectionProto = getConnectionProto();

/*
 * Hijack method calls
 */
var original_Connection_apply = ConnectionProto.apply;
ConnectionProto.apply = hijackConnection(original_Connection_apply);

// for better stackTraces
var originalMeteorCall = Meteor.call;
Meteor.call = hijackConnection(originalMeteorCall);

/*
 * Hijack DDP subscribe method
 * Used when connecting to external DDP servers
 */
var original_Connection_subscribe = ConnectionProto.subscribe;
ConnectionProto.subscribe = hijackSubscribe(original_Connection_subscribe);

/**
 * Hijack Meteor.subscribe because Meteor.subscribe binds to
 * Connection.subscribe before the hijack
 */
var original_Meteor_subscribe = Meteor.subscribe;
Meteor.subscribe = hijackSubscribe(original_Meteor_subscribe);

var original_Cursor_observe = LocalCollection.Cursor.prototype.observe;
LocalCollection.Cursor.prototype.observe = hijackCursor(original_Cursor_observe);

function getConnectionProto() {
  var con = DDP.connect(window.location.origin);
  con.disconnect();
  var proto = con.constructor.prototype;
  return proto;
}

// we've a better error handling support with zones
// Meteor._debug will prevent it (specially inside deps)
// So we are killing Meteor._debug
Meteor._debug = function(message, stack) {
  var err = new Error();
  err.stack = stack;
  throw err;
};
