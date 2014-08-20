// Hijack only if zone is available
if(!window.Zone || !window.Zone.inited) {
  return;
}

// some EnvironmentVariables to optimize tracking
// see /assests/utils.js
Zone.fromCall = new Meteor.EnvironmentVariable();
Zone.fromObserve = new Meteor.EnvironmentVariable();
Zone.notFromForEach = new Meteor.EnvironmentVariable();

var ConnectionProto = getConnectionProto();

/*
 * Hijack method calls
 */
ConnectionProto.apply = hijackConnection(
  ConnectionProto.apply,
  'Connection.apply'
);

/**
 * For better stackTraces
 */
Meteor.call = hijackConnection(Meteor.call, 'Meteor.call');

/*
 * Hijack DDP subscribe method
 * Used when connecting to external DDP servers
 */
ConnectionProto.subscribe = hijackSubscribe(
  ConnectionProto.subscribe,
  'Connection.subscribe'
);

/**
 * Hijack Meteor.subscribe because Meteor.subscribe binds to
 * Connection.subscribe before the hijack
 */
Meteor.subscribe = hijackSubscribe(Meteor.subscribe, 'Meteor.subscribe');

hijackCursor(LocalCollection.Cursor.prototype);

/**
 * Hijack Template.prototype.events() to add useful owner info to zone object
 * Use UI.Component.events for older versions of Meteor
 * e.g. {type: 'templateEvent', event: 'click .selector', template: 'home'}
 */
if(Template.prototype) {
  Template.prototype.events = hijackComponentEvents(Template.prototype.events);
} else if (UI.Component) {
  UI.Component.events = hijackComponentEvents(UI.Component.events);
}

/**
 * Hijack global template helpers using `UI.registerHelper`
 */
hijackGlobalHelpers(UI._globalHelpers);
UI.registerHelper = hijackNewGlobalHelpers(UI.registerHelper);

/**
 * Hijack each templates rendered handler to add template name to owner info
 */
var CoreTemplates = ['prototype', '__body__', '__dynamic', '__dynamicWithDataContext', '__IronDefaultLayout__'];
Meteor.startup(function () {
  _(Template).each(function (template, name) {
    if(typeof template === 'object') {
      // hijack template helpers including 'rendered'
      if(_.indexOf(CoreTemplates, name) === -1) {
        hijackTemplateHelpers(template, name);
        template.helpers = hijackNewTemplateHelpers(template.helpers, name);
      }
    }
  });
});

/**
 * Hijack Session.set to add events
 */
Session.set = hijackSessionSet(Session.set, 'Session.set');

/**
 * Hijack Deps.autorun to set correct zone owner type
 * Otherwise these will be setTimeout
 */
Deps.flush = hijackDepsFlush(Deps.flush, 'Deps.flush');

/**
 * Hijack IronRouter if it's available
 * Add iron router specific events
 */
 if(Package['iron-router']){
   var Router = Package['iron-router'].Router;
   var RouteController = Package['iron-router'].RouteController;
   Router = hijackRouterGlobalHooks(Router, 'Router.global');
   Router.configure = hijackRouterConfigure(Router.configure, 'Router.configure');
   Router.route = hijackRouterOptions(Router.route, 'Router.route');
   RouteController.extend = hijackRouteController(RouteController.extend, 'RouteController.extend');
 }

//--------------------------------------------------------------------------\\

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
var originalMeteorDebug = Meteor._debug;
Meteor._debug = function(message, stack) {
  var err = new Error(message);
  err.stack = (stack instanceof Error)? stack.stack: stack;
  if(zone) {
    zone.onError(err);
  } else {
    originalMeteorDebug(message, stack);
  }
};
