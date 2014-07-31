nextZoneId = function() {
  var zoneIds = 0;
  return function () {
    return zoneIds++;
  };
}();

extendZone = function(fields) {
  for(var key in fields) {
    Zone.prototype[key] = fields[key];
  }
};

// extendZone with our own functionality

extendZone({
  _fork: Zone.prototype.fork,

  onError: function (e) {
    this.erroredStack = new Stacktrace(e);
    Zone.Reporters.run(this);
  },

  fork: function (locals) {
    var zone = this._fork(locals);
    zone.currentStack = getStacktrace();
    zone.createdAt = Date.now();
    zone.id = nextZoneId();

    // when creating a new zone, it will use's parent zone as __proto__
    // that's why we can access ancesstor properties
    // but we are deleting eventMap just after zone ran
    // so, we need to create eventMap explicitely to stay it in the current zone
    zone.eventMap = zone.eventMap;

    // infoMap is just like eventMap, but it deepCopy all the info
    // so only previous zone's info will be exists
    zone.infoMap = zone.infoMap;
    if(zone.parent && zone.parent._info) {
      var parentInfo = zone.parent._info;
      zone.infoMap[zone.parent.id] = {};
      for(var key in parentInfo) {
        zone.infoMap[zone.parent.id][key] = parentInfo[key];
      }
    }

    // make sure owner doesn't get inherited
    zone.owner = undefined;
    return zone;
  },

  beforeTask: function() {
    this.runAt = Date.now();

    // create eventMap for the first time
    // eventMap will be deleted just after zone completed
    // but it will be available only in the errroed zone
    // so, in that zone, someone can access all the events happened on the
    // async call stack
    if(!this.eventMap) {
      this.eventMap = {};
      this.infoMap = {};
    }

    // _events will only be available during the zone running time only
    // an event can be run multiple times. So we can't maintain the events
    // in this array forever.
    // best option is to add it to eventMap, which carries events to the
    // top of the stack
    this._events = [];
    this.eventMap[this.id] = this._events;
    this._info = {};
    this.infoMap[this.id] = this._info;

    // if there is _ownerArgs we need to add it as an event
    // after that we don't need to _ownerArgs
    if(this._ownerArgs) {
      this.addEvent({type: "owner-args", args: this._ownerArgs, at: Date.now()});
      delete this._ownerArgs;
    }
  },

  afterTask: function() {
    delete this._events;
    delete this._info;
    // we only keep eventMap in the errored zone only
    if(!this.erroredStack) {
      delete this.eventMap;
      delete this.infoMap;
    }
  },

  addEvent: function(event) {
    // when zone completed _events will be removed
    // but actions may happen even after the zone completed
    // and we are not interested about those
    if(this._events) {
      this._events.push(event);
    }
  },

  setInfo: function(key, value) {
    console.log(key, value);
    if(this._info) {
      this._info[key] = value;
    }
  },

  // we can add it the zone direcly, because zone can be run many times
  // we can't add this as a event yet, since zone doesn't started yet
  // so we'll add this to a special fields and it's will added to the _events
  // when _events will be creating
  setOwnerArgs: function(args) {
    this._ownerArgs = args;
  },

  setOwner: function(ownerInfo) {
    this.owner = ownerInfo;
  },

  // validate and pick arguments
  // we don't need to capture event object as the argument
  // (then we can't to JSON stringify)
  // That's why we've this
  bind: function (func, skipEnqueue, ownerInfo, validateArgs) {
    validateArgs = validateArgs || function() {return []};
    skipEnqueue || this.enqueueTask(func);
    var zone = this.fork();

    if(ownerInfo) {
      zone.setOwner(ownerInfo);
      ownerInfo.zoneId = zone.id;
      this.addEvent(ownerInfo);
    }

    return function zoneBoundFn() {
      if(ownerInfo) {
        zone.setOwnerArgs(validateArgs(this, arguments));
      }
      return zone.run(func, this, arguments);
    };
  },

  bindOnce: function (func, ownerInfo, validateArgs) {
    var boundZone = this;
    return this.bind(function() {
      var result = func.apply(this, arguments);
      boundZone.dequeueTask(func);
      return result;
    }, false, ownerInfo, validateArgs);
  }
});

/**
 * Create a stack trace
 */

function getStacktrace () {
  var stack = getStacktraceWithUncaughtError();
  if (stack && stack._e.stack) {
    getStacktrace = getStacktraceWithUncaughtError;
    return stack;
  } else {
    getStacktrace = getStacktraceWithCaughtError;
    return getStacktrace();
  }
};

function getStacktraceWithUncaughtError () {
  return new Stacktrace(new Error());
}

function getStacktraceWithCaughtError () {
  try {
    throw new Error();
  } catch (e) {
    return new Stacktrace(e);
  }
}

/*
 * Wrapped stacktrace
 *
 * We need this because in some implementations, constructing a trace is slow
 * and so we want to defer accessing the trace for as long as possible
 */

function Stacktrace (e) {
  this._e = e;
}

Stacktrace.prototype.get = function() {
  if(this._e && typeof this._e.stack == 'string') {
    return this._e.stack
      .split('\n')
      .filter(this.stackFramesFilter)
      .join('\n');
  } else {
    return "";
  }
};

Stacktrace.prototype.stackFramesFilter = function(line) {
  var filterRegExp = /\/packages\/zones\/assets\/|^Error$/;
  return !line.match(filterRegExp);
};
