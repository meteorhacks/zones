/**
 * Replace window.zone with our stack trace enabled zone
 * This way, it's possible to trace all the way up
 */

window.zone = zone.fork({
  onError: function (e) {
    var zone = this.fork();
    zone.currentStack = new Stacktrace(e);
    zone.reporters.forEach(function (reporter) {
      reporter(zone);
    });
  },

  fork: function (locals) {
    var zone = this._fork(locals);
    zone.currentStack = getStacktrace();
    zone.createdAt = Date.now();
    return zone;
  },

  beforeTask: function() {
    zone.runAt = Date.now();
  },

  _fork: zone.fork
});

window.zone.reporters = [Zone.reporters._default];

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
  return this._e.stack
    .split('\n')
    .filter(this.stackFramesFilter)
    .join('\n');
};

Stacktrace.prototype.stackFramesFilter = function(line) {
  return line.indexOf('zone.js') === -1;
};
