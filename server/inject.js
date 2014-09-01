// only Meteor < 0.9 has this tyoe of naming for packages
if(Package['inject-initial']) {
  Inject = Package['inject-initial'].Inject;
  var assets = '/packages/zones/assets';
} else {
  // for Meteor 0.9 +
  Inject = Package['meteorhacks:inject-initial'].Inject;

  // meteor test-packages prefix the package with `loca-test:` 
  // that's why we need this hack
  if(process.env['METEOR_ENV'] == 'test') {
    var assets = '/packages/local-test:meteorhacks:zones/assets';
  } else {
    var assets = '/packages/meteorhacks:zones/assets';
  }
}

var HTML = [
  '<script src="'+assets+'/utils.js" type="text/javascript"></script>',
  '<script src="'+assets+'/before.js" type="text/javascript"></script>',
  '<script src="'+assets+'/zone.js" type="text/javascript"></script>',
  '<!--[if lt IE 10 ]> <script>Zone.disabled=true</script> <![endif]-->',
  '<script src="'+assets+'/tracer.js" type="text/javascript"></script>',
  '<script src="'+assets+'/after.js" type="text/javascript"></script>',
  '<script src="'+assets+'/reporters.js" type="text/javascript"></script>',
];

Zones = {
  html: HTML.join('\n'),
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
