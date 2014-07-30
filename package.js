var fs = Npm.require('fs');
var path = Npm.require('path');

Package.describe({
  summary: 'Zone.Js integration for meteor'
});

Package.on_use(function (api) {
  addPackageFiles(api);

  // Add iron router only if it exists
  if(ironRouterExists()) {
    api.use(['iron-router'], ['client', 'server']);
  }

  // A hack to detect if IR has been added or removed from the app
  // if IR was not there on the app and added later.
  if(isAppDir('./')) {
    api.add_files('../../.meteor/packages', ['client', 'server']);
  }
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

//--------------------------------------------------------------------------\\

function ironRouterExists() {
  try {
    var meteorPackages = fs.readFileSync(path.join(meteorRoot(), '.meteor', 'packages'), 'utf8');
    return !!meteorPackages.match(/iron-router/);
  } catch(ex) {
    // seems like FastRender running outside a Meteor app (ie: with tinytest)
    // So there is no iron-router
    return false;
  }
}

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
