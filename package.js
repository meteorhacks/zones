
Package.describe({
  summary: 'Zone.js integration for meteor'
});

Package.on_use(function (api) {
  api.add_files('client/zone.js', 'client');
  api.add_files('client/tracer.js', 'client');
  api.add_files('client/hijack/method_calls.js', 'client');

  api.export('Zone', 'client');
});

Package.on_test(function (api) {
  // body...
});
