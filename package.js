Package.describe({
  summary: 'Zone.Js integration for meteor'
});

Package.on_use(function (api) {
  addPackageFiles(api);
});

Package.on_test(function (api) {
  addPackageFiles(api);

  api.use([
    'tinytest',
    'test-helpers',
  ], 'client');

  api.add_files([
    'tests/loader.js'
  ], 'client')
});

function addPackageFiles(api) {
  api.add_files([
    'assets/utils.js',
    'assets/before.js',
    'assets/zone.js',
    'assets/after.js',
    'assets/reporters.js',
    'assets/tracer.js',
  ], 'client', {isAsset: true});

  api.add_files(['server/inject.js'], 'server');

  api.add_files([
    'client/hijack.js'
  ], 'client');

  api.use('ui', 'client');
  api.use('templating', 'client');
  api.use('deps', 'client');
  api.use('session', 'client');
  api.use('livedata', 'client');
  api.use('minimongo', 'client');
  api.use('inject-initial');
}
