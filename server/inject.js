var connect = Npm.require('connect');

Zones = {
  scripts: null,
  enabled: true,
};

Zones.enable = function () {
  Zones.enabled = true;
};

Zones.disable = function () {
  Zones.enabled = false;
};

// inject the script tag
if(Package['inject-initial']) {
  // only Meteor < 0.9 has this tyoe of naming for packages
  Inject = Package['inject-initial'].Inject;
} else {
  // for Meteor 0.9 +
  Inject = Package['meteorhacks:inject-initial'].Inject;
}

var cacheAvoider = (new Date).getTime();
Inject.rawHead('zones', function () {
  var path = '/zones-assets.js?'+cacheAvoider;
  var html = '<script type="text/javascript" src="'+path+'"></script>';
  return Zones.enabled ? html : '';
});

// load, minify and concat all assets (scripts)
Zones.scripts = [
  'assets/zone.js',
  'assets/utils.js',
  'assets/tracer.js',
  'assets/reporters.js',
  'assets/init.js',
].map(function (path) {
  return Assets.getText(path);
}).map(function (content) {
  return UglifyJSMinify(content, {fromString: true}).code;
}).join('\n');

// serve minified assets
WebApp.connectHandlers
.use('/zones-assets.js', connect.compress())
.use('/zones-assets.js', function (req, res, next) {
  res.writeHead(200, {'Content-Type': 'text/javascript'});
  res.end(Zones.enabled ? Zones.scripts : '');
});
