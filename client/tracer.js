
/**
 * Replace window.zone with our stack trace enabled zone
 * This way, it's possible to trace all the way up
 */
window.zone = zone.fork({
  onError: function (e) {
    var reporter = this.reporter || console.log.bind(console);
    reporter(e.toString(), buildStacktrace(this, e));
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

function buildStacktrace (zone, exception) {
  var trace = [];
  var exception = new Stacktrace(exception);
  trace.push(filterStack(exception.get()));

  var currZone = zone;
  var totalAsyncTime = 0;
  while (currZone && currZone.currentStack) {
    var asyncTime = currZone.runAt - currZone.createdAt;
    if(asyncTime) {
      totalAsyncTime += asyncTime;
      trace.push('\n> Before: ' + totalAsyncTime + 'ms (diff: ' + asyncTime + 'ms)');
    }

    trace.push(filterStack(currZone.currentStack.get(), true));
    currZone = currZone.parent;
  }
  return trace.join('\n');
}

function filterStack(stack, removeFirstLine) {
  var stackArray = stack.split('\n');
  if(removeFirstLine) {
    stackArray.shift();
  }

  var filterRegExp = /(Zone\.)|getStacktraceWithUncaughtError|zoneBoundFn|zoneBoundOnceFn|window\.zone/;
  return stackArray.filter(function(line) {
    return !line.match(filterRegExp);
  }).join('\n');
}

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
