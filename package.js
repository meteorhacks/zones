var fs = Npm.require('fs');
var path = Npm.require('path');

Package.describe({
  name: 'meteorhacks:zones',
  summary: 'Zone.Js integration for meteor',
  version: "1.5.0",
  git: "https://github.com/meteorhacks/zones.git"
});

Package.on_use(function (api) {
  addPackageFiles(api);
  api.export('Zones', 'server');
});

Package.on_test(function (api) {
  addPackageFiles(api);

  api.use([
    'tinytest',
    'test-helpers',
  ], 'client');

  api.add_files([
    'tests/_both.js'
  ], ['client', 'server']);

  api.add_files([
    'tests/_server.js'
  ], 'server');

  api.add_files([
    'tests/loader.js',
    'tests/reporters.js',
    'tests/hijacks/methods.js',
    'tests/hijacks/subscriptions.js',
    'tests/hijacks/collections.js',
  ], 'client');
});

function addPackageFiles(api) {
  if(api.versionsFrom) {
    api.versionsFrom('METEOR@0.9.2.1');
    api.use('meteorhacks:inject-initial@1.0.0', ['server']);
  } else {
    api.use('inject-initial');
  }

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

  api.use('underscore', 'client');
  api.use('ui', 'client');
  api.use('templating', 'client');
  api.use('deps', 'client');
  api.use('session', 'client');
  api.use('livedata', 'client');
  api.use('minimongo', 'client');
}

//--------------------------------------------------------------------------\\

function meteorRoot() {
  var currentDir = process.cwd();
  while (currentDir) {
    var newDir = path.dirname(currentDir);
    if (isAppDir(currentDir)) {
      break;
    } else if (newDir === currentDir) {
      return null;
    } else {
      currentDir = newDir;
    }
  }
  return currentDir;
}

function isAppDir(filepath) {
  try {
    return fs.statSync(path.join(filepath, '.meteor', 'packages')).isFile();
  } catch (e) {
    return false;
  }
}
