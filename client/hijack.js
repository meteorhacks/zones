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

function getConnectionProto() {
  var con = DDP.connect(window.location.origin);
  con.disconnect();
  var proto = con.constructor.prototype;
  return proto;
}
