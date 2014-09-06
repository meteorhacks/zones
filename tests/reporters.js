
Tinytest.add(
  'Reporters - get()',
  function (test) {
    var reporters = Zone.Reporters.get();
    test.equal('object', typeof reporters)
    test.equal('function', typeof reporters.longStackTrace)
  }
);

Tinytest.add(
  'Reporters - get(longStackTrace)',
  function (test) {
    var reporter = Zone.Reporters.get('longStackTrace');
    test.equal('function', typeof reporter)
  }
);

Tinytest.add(
  'Reporters - add(name, reporter)',
  function (test) {
    Zone.Reporters.add('test-reporter', Function());
    var reporter = Zone.Reporters.get('test-reporter');
    test.equal('function', typeof reporter);
    Zone.Reporters.remove('test-reporter');
  }
);

Tinytest.add(
  'Reporters - remove(name)',
  function (test) {
    Zone.Reporters.add('test-reporter', Function());
    Zone.Reporters.remove('test-reporter');
    var reporter = Zone.Reporters.get('test-reporter');
    test.equal('undefined', typeof reporter);
  }
);

Tinytest.add(
  'Reporters - removeAll()',
  function (test) {
    Zone.Reporters.add('test-reporter', Function());
    Zone.Reporters.removeAll();
    Zone.Reporters.add(Zone.Reporters.longStackTrace);
    var reporter = Zone.Reporters.get('test-reporter');
    test.equal('undefined', typeof reporter);
  }
);

Tinytest.add(
  'Reporters - run(zone)',
  function (test) {
    var zone = {foo: 'bar'};
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', toBaz);
    Zone.Reporters.run(zone);
    test.equal('baz', zone.foo);
    Zone.Reporters.remove('test-reporter');
    Zone.Reporters.add(Zone.Reporters.longStackTrace);

    function toBaz(zone) {
      zone.foo = 'baz';
    }
  }
);

Tinytest.add(
  'Reporters - getErrorMessage - an error object',
  function (test) {
    var message = "hello";
    var err = new Error(message);
    test.equal(Zone.Reporters.getErrorMessage(err), message);
  }
);

Tinytest.add(
  'Reporters - getErrorMessage - string',
  function (test) {
    var message = "hello";
    test.equal(Zone.Reporters.getErrorMessage(message), message);
  }
);

Tinytest.add(
  'Reporters - getErrorMessage - object',
  function (test) {
    var message = "hello";
    var err = {message: message};
    test.equal(Zone.Reporters.getErrorMessage(err), message);
  }
);

Tinytest.add(
  'Reporters - getErrorMessage - number',
  function (test) {
    var number = 2;
    test.equal(Zone.Reporters.getErrorMessage(number), number.toString());
  }
);

Tinytest.add(
  'Reporters - getErrorMessage - nothing',
  function (test) {
    test.equal(/Oops/.test(Zone.Reporters.getErrorMessage()), true);
  }
);
