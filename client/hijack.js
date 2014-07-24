// some EnvironmentVariables to optimize tracking
// see /assests/utils.js
Zone.fromCall = new Meteor.EnvironmentVariable();
Zone.fromObserve = new Meteor.EnvironmentVariable();

var ConnectionProto = getConnectionProto();

/*
 * Hijack method calls
 */
var original_Connection_apply = ConnectionProto.apply;
ConnectionProto.apply = hijackConnection(original_Connection_apply, 'Connection.apply');

// for better stackTraces
var originalMeteorCall = Meteor.call;
Meteor.call = hijackConnection(originalMeteorCall, 'Meteor.call');

/*
 * Hijack DDP subscribe method
 * Used when connecting to external DDP servers
 */
var original_Connection_subscribe = ConnectionProto.subscribe;
ConnectionProto.subscribe = hijackSubscribe(original_Connection_subscribe, 'Connection.subscribe');

/**
 * Hijack Meteor.subscribe because Meteor.subscribe binds to
 * Connection.subscribe before the hijack
 */
var original_Meteor_subscribe = Meteor.subscribe;
Meteor.subscribe = hijackSubscribe(original_Meteor_subscribe, 'Meteor.subscribe');

hijackCursor(LocalCollection.Cursor.prototype);

/**
 * Hijack UI.Component.events() to add useful owner info to zone object
 * e.g. {type: 'templateEvent', event: 'click .selector', template: 'home'}
 */
var original_Component_events = UI.Component.events;
UI.Component.events = hijackComponentEvents(original_Component_events);

/**
 * Hijack each templates rendered handler to add template name to owner info
 */
Meteor.startup(function () {
  _(Template).each(function (template, name) {
    if(typeof template === 'object' && typeof template.rendered == 'function') {
      var original = template.rendered;
      template.rendered = hijackTemplateRendered(original, name);
    }
  });
});

var originalSessionSet = Session.set;
Session.set = hijackSessionSet(originalSessionSet, 'Session.set');

/**
 * Hijack Deps.autorun to set correct zone owner type
 * Otherwise these will be setTimeout
 */
var originalDepsFlush = Deps.flush;
Deps.flush = hijackDepsFlush(originalDepsFlush, 'Deps.flush');

function getConnectionProto() {
  var con = DDP.connect(getCurrentUrlOrigin());
  con.disconnect();
  var proto = con.constructor.prototype;
  return proto;
}

function getCurrentUrlOrigin() {
  // Internet Explorer doesn't have window.location.origin
  return window.location.origin || window.location.protocol
  + window.location.hostname
  + window.location.port;
}

// we've a better error handling support with zones
// Meteor._debug will prevent it (specially inside deps)
// So we are killing Meteor._debug
Meteor._debug = function(message, stack) {
  var err = new Error(message);
  err.stack = stack;
  throw err;
};
