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

