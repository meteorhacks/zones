
Tinytest.addAsync(
  'Hijacks - Methods - Meteor.call',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expected = {
        args: ['arg1', 'arg2'],
        name: 'test',
        type: 'Meteor.call',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      test.equal(expected, owner);

      // reset zone for other tests and continue
      Zone.Reporters.add(Zone.longStackTrace);
      Zone.Reporters.remove('test-reporter');
      next();
    });

    Meteor.call('test', 'arg1', 'arg2', function () {
      throw new Error('test-error');
    });
  }
);
