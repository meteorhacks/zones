
Tinytest.add(
  'Loader - Load all critical files first',
  function (test) {
    var scriptElement = document.getElementsByTagName('script')[0];
    test.equal('/zones-assets.js', getSrc(scriptElement).split('?')[0]);
  }
);

Tinytest.addAsync(
  'Loader - do not load if Zone is disabled',
  function (test, next) {
    // disable it and see whether zones don't get loaded
    Meteor.call('zone-off', function () {
      $.get(location.href, function (html, status) {
        // append the html to a temporary container to search
        var scriptElement = $('<div>').append(html).find('script')[0];
        var src = getSrc(scriptElement).split('?')[0];
        test.notEqual('/zones-assets.js', src);

        // enable it and test whether zones scripts are loaded
        Meteor.call('zone-on', function () {
          $.get(location.href, function (html, status) {
            // append the html to a temporary container to search
            var scriptElement = $('<div>').append(html).find('script')[0];
            var src = getSrc(scriptElement).split('?')[0];
            test.equal('/zones-assets.js', src);

            // end the test
            next();
          });
        });

      });
    });
  }
);

function getSrc(el) {
  return el.src.replace(location.origin, '');
}
