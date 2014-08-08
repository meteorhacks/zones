Inject = Package['inject-initial'].Inject;

var SCRIPTS = [
  '/packages/zones/assets/utils.js',
  '/packages/zones/assets/before.js',
  '/packages/zones/assets/zone.js',
  '/packages/zones/assets/tracer.js',
  '/packages/zones/assets/after.js',
  '/packages/zones/assets/reporters.js',
];

Zones = {
  html: SCRIPTS.map(toScriptTag).join('\n'),
  enabled: true,
};

Zones.enable = function () {
  Zones.enabled = true;
};

Zones.disable = function () {
  Zones.enabled = false;
};

Inject.rawHead('zones', function () {
  return Zones.enabled ? Zones.html : '';
});

//--------------------------------------------------------------------------\\

function toScriptTag (path) {
  return '<script src="' + path + '" type="text/javascript"></script>';
};
