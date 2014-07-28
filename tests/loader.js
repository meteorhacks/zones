
Tinytest.add(
  'Loader - Load all critical files first',
  function (test) {
    var scripts = document.getElementsByTagName('script');
    scripts = Array.prototype.slice.call(scripts);
    scripts = scripts.slice(0, 6).map(getSrc);
    var expected = [
      '/packages/zones/assets/utils.js',
      '/packages/zones/assets/before.js',
      '/packages/zones/assets/zone.js',
      '/packages/zones/assets/tracer.js',
      '/packages/zones/assets/after.js',
      '/packages/zones/assets/reporters.js',
    ];
    test.equal(expected, scripts);

    function getSrc(el) {
      return el.src.replace(location.origin, '');
    }
  }
);

Tinytest.add(
  'Loader - do not override some functions',
  function (test) {
    var expected = 'function requestAnimationFrame() { [native code] }';
    test.equal(expected, requestAnimationFrame.toString());
  }
);
