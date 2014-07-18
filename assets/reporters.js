
var reporters = {};

Zone.Reporters = {};

Zone.Reporters.get = function(name) {
  return name ? reporters[name] : reporters;
};

Zone.Reporters.add = function(name, reporter) {
  reporters[name] = reporter;
};

Zone.Reporters.remove = function(name) {
  delete reporters[name];
};

Zone.Reporters.removeAll = function(name) {
  reporters = {};
};

Zone.Reporters.run = function(zone) {
  for(var name in reporters) {
    reporters[name](zone);
  }
};

/*
 * Register default reporter
 */

Zone.Reporters.longStackTrace = function (zone) {
  var trace = [];
  var currZone = zone;
  var totalAsyncTime = 0;

  trace.push(zone.erroredStack.get());

  while (currZone && currZone.currentStack) {
    var asyncTime = currZone.runAt - currZone.createdAt;
    if(asyncTime && asyncTime > 0) {
      totalAsyncTime += asyncTime;
      trace.push('\n> Before: ' + totalAsyncTime + 'ms (diff: ' + asyncTime + 'ms)');
    }

    trace.push(currZone.currentStack.get());
    currZone = currZone.parent;
  }

  console.log(trace.join('\n'));
}

Zone.Reporters.add('longStackTrace', Zone.Reporters.longStackTrace);
