Package.describe({
  summary: 'Zone.js integration for meteor'
});

Package.on_use(function (api) {
  api.add_files([
    'assets/zone.js',
    'assets/tracer.js'
  ], 'client', {isAsset: true});

  api.add_files(['server/inject.js'], 'server');

  api.add_files([
    'client/hijack/method_calls.js'
  ], 'client');

  api.use('inject-initial');
});
