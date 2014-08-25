
var SCRIPTS = [
  '/packages/zones/assets/utils.js',
  '/packages/zones/assets/before.js',
  '/packages/zones/assets/zone.js',
  '/packages/zones/assets/tracer.js',
  '/packages/zones/assets/after.js',
  '/packages/zones/assets/reporters.js',
];

Tinytest.add(
  'Loader - Load all critical files first',
  function (test) {
    var scripts = document.getElementsByTagName('script');
    scripts = Array.prototype.slice.call(scripts);
    scripts = scripts.slice(0, 6).map(getSrc);
    test.equal(SCRIPTS, scripts);

    function getSrc(el) {
      return el.src.replace(location.origin, '');
    }
  }
);

Tinytest.add(
  'Loader - do not override some functions',
  function (test) {
    if(requestAnimationFrame) {
      var nativeCodeRegEx = /\[native code\]/gm;
      var fnString = requestAnimationFrame.toString();
      test.isTrue(nativeCodeRegEx.exec(fnString));
    }
  }
);

Tinytest.addAsync(
  'Loader - do not load if Zone is disabled',
  function (test, next) {
    // disable it and see whether zones don't get loaded
    Meteor.call('zone-off', function () {
      $.get(location.href, function (html, status) {
        // append the html to a temporary container to search
        var scripts = $('<div>').append(html).find('script');
        scripts = Array.prototype.slice.call(scripts);
        scripts = scripts.map(getSrc);
        scripts.forEach(function (path) {
          test.equal(SCRIPTS.indexOf(path), -1);
        });

        // enable it and test whether zones scripts are loaded
        Meteor.call('zone-on', function () {
          $.get(location.href, function (html, status) {
            // append the html to a temporary container to search
            var scripts = $('<div>').append(html).find('script');
            scripts = Array.prototype.slice.call(scripts);
            scripts = scripts.slice(0, 6).map(getSrc);
            test.equal(SCRIPTS, scripts);

            // end the test
            next();
          });
        });

      });
    });

    function getSrc(el) {
      return el.src.replace(location.origin, '');
    }
  }
);
