Inject = Package['inject-initial'].Inject;

var scripts = [
  '/packages/zones/assets/utils.js',
  '/packages/zones/assets/before.js',
  '/packages/zones/assets/zone.js',
  '/packages/zones/assets/tracer.js',
  '/packages/zones/assets/after.js',
  '/packages/zones/assets/reporters.js',
];

var html = "";
scripts.forEach(function(script) {
  html+= '<script src="' + script + '" type="text/javascript"></script>';
});

Inject.rawHead("zones", html);

Meteor.methods({
  'zone-on': function () {
    Inject.rawHeads['zones'] = html;
  },

  'zone-off': function () {
    Inject.rawHeads['zones'] = '';
  }
});
