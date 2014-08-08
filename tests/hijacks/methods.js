
Tinytest.addAsync(
  'Hijacks - Methods - default',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expectedOwner = {
        args: ['arg1', 'arg2'],
        name: 'test',
        // time: 123,
        type: 'Meteor.call',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.time);
      delete owner.time;
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      test.equal(expectedOwner, owner);

      // test whether zone has correct info
      // the parent zone contains method info
      var info = zone.infoMap[zone.parent.id];
      var expectedInfo = {
        'Meteor.call': {
          type: 'Meteor.call',
          name: 'test',
          // time: 123,
          args: ['arg1', 'arg2'],
        }
      };

      test.equal('object', typeof info);
      test.equal('number', typeof info['Meteor.call'].time);
      delete info['Meteor.call'].time;
      test.equal(expectedInfo, info);

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
