
Zone.reporters = {};

Zone.reporters._default = function (zone) {
  throw zone.currentStack._e;
}

Zone.reporters.longStackTrace = function (zone) {
  console.log(buildStack(zone).map(formatStack).join('\n'));

  function formatStack (stack) {
    var timeStr = '\n> Before: ' + stack.total + 'ms (diff: ' + stack.diff + 'ms)';
    return (stack.diff ? timeStr : '') + '\n' + stack.stack;
  }
}

function buildStack (zone) {
  var trace = [];
  var total = 0;
  while (zone && zone.currentStack) {
    var diff = zone.runAt - zone.createdAt;
    var stack = filterStack(zone.currentStack.get());
    diff = (diff > 0) ? diff : 0;
    total += diff;
    zone = zone.parent;
    trace.push({stack: stack, total: total, diff: diff});
  }

  return trace;
}

function filterStack(stack) {
  var stackArray = stack.split('\n');
  var filterRegExp = /\/packages\/zones\/assets\//;
  return stackArray.filter(function(line) {
    return !line.match(filterRegExp);
  }).join('\n');
};