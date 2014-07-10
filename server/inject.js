
var scripts = [
  '/packages/zone/assets/zone.js',
  '/packages/zone/assets/utils.js',
  '/packages/zone/assets/tracer.js'
];

var html = "";
scripts.forEach(function(script) {
  html+= '<script src="' + script + '" type="text/javascript"></script>';
});

Package['inject-initial'].Inject.rawHead("zone", html);
