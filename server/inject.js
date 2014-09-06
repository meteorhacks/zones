var format = Npm.require('util').format;

// only Meteor < 0.9 has this tyoe of naming for packages
if(Package['inject-initial']) {
  Inject = Package['inject-initial'].Inject;
  var packageName = 'zones';
} else {
  // for Meteor 0.9 +
  Inject = Package['meteorhacks:inject-initial'].Inject;

  // this is a trick to idnentify the test environment
  // need to set this env var before running tests
  if(process.env['METEOR_ENV'] == 'test') {
    var packageName = 'local-test:meteorhacks:zones';
  } else {
    var packageName = 'meteorhacks:zones';
  }
}

var fileList = [
  'utils.js', 'before.js', 'zone.js', 'tracer.js',
  'after.js', 'reporters.js'
];

var cacheAvoider = (new Date).getTime();
var finalHtml = '';
fileList.forEach(function(file) {
  var template = '<script type="text/javascript" src="/packages/%s/assets/%s?%s"></script>\n';
  finalHtml += format(template, packageName, file, cacheAvoider);
});

Zones = {
  html: finalHtml,
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
