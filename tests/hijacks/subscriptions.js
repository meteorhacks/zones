
Tinytest.addAsync(
  'Hijacks - Subscriptions - default',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expected = {
        args: ['arg1', 'arg2'],
        name: 'test-ready',
        type: 'Meteor.subscribe',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.time);
      delete owner.time;
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      test.equal(expected, owner);

      // test whether zone has correct info
      // the parent zone contains method info
      var info = zone.infoMap[zone.parent.id];
      var expectedInfo = {
        'Meteor.subscribe': {
          type: 'Meteor.subscribe',
          name: 'test-ready',
          // time: 123,
          args: ['arg1', 'arg2'],
        }
      };

      test.equal('object', typeof info);
      test.equal('number', typeof info['Meteor.subscribe'].time);
      delete info['Meteor.subscribe'].time;
      test.equal(expectedInfo, info);

      // reset zone for other tests and continue
      Zone.Reporters.add(Zone.longStackTrace);
      Zone.Reporters.remove('test-reporter');
      next();
    });

    // remove info from previous tests (if any)
    zone._info = {};

    Meteor.subscribe('test-ready', 'arg1', 'arg2', function () {
      throw new Error('test-error');
    });
  }
);

Tinytest.addAsync(
  'Hijacks - Subscriptions - onReady',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expected = {
        args: ['arg1', 'arg2'],
        callbackType: 'onReady',
        name: 'test-ready',
        type: 'Meteor.subscribe',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.time);
      delete owner.time;
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      test.equal(expected, owner);

      // test whether zone has correct info
      // the parent zone contains method info
      var info = zone.infoMap[zone.parent.id];
      var expectedInfo = {
        'Meteor.subscribe': {
          type: 'Meteor.subscribe',
          name: 'test-ready',
          // time: 123,
          args: ['arg1', 'arg2'],
          callbackType: 'onReady'
        }
      };

      test.equal('object', typeof info);
      test.equal('number', typeof info['Meteor.subscribe'].time);
      delete info['Meteor.subscribe'].time;
      test.equal(expectedInfo, info);

      // reset zone for other tests and continue
      Zone.Reporters.add(Zone.longStackTrace);
      Zone.Reporters.remove('test-reporter');
      next();
    });

    // remove info from previous tests (if any)
    zone._info = {};

    Meteor.subscribe('test-ready', 'arg1', 'arg2', {
      onReady: function () {
        throw new Error('test-error');
      }
    });
  }
);

Tinytest.addAsync(
  'Hijacks - Subscriptions - onError',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expected = {
        args: ['arg1', 'arg2'],
        callbackType: 'onError',
        name: 'test-error',
        type: 'Meteor.subscribe',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.time);
      delete owner.time;
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      test.equal(expected, owner);

      // test whether zone has correct info
      // the parent zone contains method info
      var info = zone.infoMap[zone.parent.id];
      var expectedInfo = {
        'Meteor.subscribe': {
          type: 'Meteor.subscribe',
          name: 'test-error',
          // time: 123,
          args: ['arg1', 'arg2'],
          callbackType: 'onError'
        }
      };

      test.equal('object', typeof info);
      test.equal('number', typeof info['Meteor.subscribe'].time);
      delete info['Meteor.subscribe'].time;
      test.equal(expectedInfo, info);

      // reset zone for other tests and continue
      Zone.Reporters.add(Zone.longStackTrace);
      Zone.Reporters.remove('test-reporter');
      next();
    });

    // remove info from previous tests (if any)
    zone._info = {};

    Meteor.subscribe('test-error', 'arg1', 'arg2', {
      onError: function () {
        throw new Error('test-error');
      }
    });
  }
);
