Tinytest.addAsync(
  'Hijacks - Collections - insert',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expected = {
        args: [
          [{_id: 'foo', bar: 'baz'}],
          {returnStubValue: true}
        ],
        name: '/test-collection/insert',
        type: 'Connection.apply',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      test.equal(expected, owner);

      // test whether zone has correct info
      // the parent zone contains method info
      var info = zone.infoMap[zone.parent.id];
      var expectedInfo = {
        method: {
          name: '/test-collection/insert',
          args: [
            [{_id: 'foo', bar: 'baz'}],
            {returnStubValue: true}
          ],
        }
      };

      test.equal('object', typeof info);
      test.equal(expectedInfo, info);

      // reset zone for other tests and continue
      Zone.Reporters.add(Zone.longStackTrace);
      Zone.Reporters.remove('test-reporter');
      next();
    });

    TestCollection.remove({_id: 'foo'}, function () {
      TestCollection.insert({_id: 'foo', bar: 'baz'}, function () {
        throw new Error('test-error');
      });
    });
  }
);

Tinytest.addAsync(
  'Hijacks - Collections - update',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expected = {
        args: [
          [{_id: 'foo'}, {$set: {bar: 'bat'}}, {}],
          {returnStubValue: true}
        ],
        name: '/test-collection/update',
        type: 'Connection.apply',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      test.equal(expected, owner);

      // test whether zone has correct info
      // the parent zone contains method info
      var info = zone.infoMap[zone.parent.id];
      var expectedInfo = {
        method: {
          name: '/test-collection/update',
          args: [
            [{_id: 'foo'}, {$set: {bar: 'bat'}}, {}],
            {returnStubValue: true}
          ],
        }
      };

      test.equal('object', typeof info);
      test.equal(expectedInfo, info);

      // reset zone for other tests and continue
      Zone.Reporters.add(Zone.longStackTrace);
      Zone.Reporters.remove('test-reporter');
      next();
    });

    TestCollection.remove({_id: 'foo'}, function () {
      TestCollection.insert({_id: 'foo', bar: 'baz'}, function () {
        TestCollection.update({_id: 'foo'}, {$set: {bar: 'bat'}}, function () {
          throw new Error('test-error');
        });
      });
    });
  }
);

Tinytest.addAsync(
  'Hijacks - Collections - upsert (new)',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expected = {
        args: [
          [
            {_id: 'foo'},
            {$set: {bar: 'bat'}},
            {
              _returnObject: true,
              upsert: true,
              // insertedId: 'asd'
            }
          ],
          {returnStubValue: true}
        ],
        name: '/test-collection/update',
        type: 'Connection.apply',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      if(owner.args[0][2].insertedId) {
        test.equal('string', typeof owner.args[0][2].insertedId);
      }
      delete owner.args[0][2].insertedId;
      test.equal(expected, owner);

      // test whether zone has correct info
      // the parent zone contains method info
      var info = zone.infoMap[zone.parent.id];
      var expectedInfo = {
        method: {
          name: '/test-collection/update',
          args: [
            [
              {_id: 'foo'},
              {$set: {bar: 'bat'}},
              {
                _returnObject: true,
                upsert: true,
                // insertedId: 'asd'
              }
            ],
            {returnStubValue: true}
          ],
        }
      };

      test.equal('object', typeof info);
      test.equal(expectedInfo, info);

      // reset zone for other tests and continue
      Zone.Reporters.add(Zone.longStackTrace);
      Zone.Reporters.remove('test-reporter');
      next();
    });

    TestCollection.remove({_id: 'foo'}, function () {
      TestCollection.upsert({_id: 'foo'}, {$set: {bar: 'bat'}}, function () {
        throw new Error('test-error');
      });
    });
  }
);

Tinytest.addAsync(
  'Hijacks - Collections - upsert',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expected = {
        args: [
          [
            {_id: 'foo'},
            {$set: {bar: 'bat'}},
            {
              _returnObject: true,
              upsert: true,
              // insertedId: 'asd'
            }
          ],
          {returnStubValue: true}
        ],
        name: '/test-collection/update',
        type: 'Connection.apply',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      if(owner.args[0][2].insertedId) {
        test.equal('string', typeof owner.args[0][2].insertedId);
      }
      delete owner.args[0][2].insertedId;
      test.equal(expected, owner);

      // test whether zone has correct info
      // the parent zone contains method info
      var info = zone.infoMap[zone.parent.id];
      var expectedInfo = {
        method: {
          name: '/test-collection/update',
          args: [
            [
              {_id: 'foo'},
              {$set: {bar: 'bat'}},
              {
                _returnObject: true,
                upsert: true,
                // insertedId: 'asd'
              }
            ],
            {returnStubValue: true}
          ],
        }
      };

      test.equal('object', typeof info);
      test.equal(expectedInfo, info);
      console.log('-- expectedInfo', expectedInfo)
      console.log('-- info', info)

      // reset zone for other tests and continue
      Zone.Reporters.add(Zone.longStackTrace);
      Zone.Reporters.remove('test-reporter');
      next();
    });

    TestCollection.remove({_id: 'foo'}, function () {
      TestCollection.insert({_id: 'foo', bar: 'baz'}, function () {
        TestCollection.upsert({_id: 'foo'}, {$set: {bar: 'bat'}}, function () {
          throw new Error('test-error');
        });
      });
    });
  }
);

Tinytest.addAsync(
  'Hijacks - Collections - remove',
  function (test, next) {
    Zone.Reporters.removeAll();
    Zone.Reporters.add('test-reporter', function (zone) {

      // test whether zone has correct owner info
      var owner = zone.owner;
      var expected = {
        args: [
          [{_id: 'foo'}],
          {returnStubValue: true}
        ],
        name: '/test-collection/remove',
        type: 'Connection.apply',
        // zoneId: 123
      };

      test.equal('object', typeof owner);
      test.equal('number', typeof owner.zoneId);
      delete owner.zoneId;
      test.equal(expected, owner);

      // test whether zone has correct info
      // the parent zone contains method info
      var info = zone.infoMap[zone.parent.id];
      var expectedInfo = {
        method: {
          name: '/test-collection/remove',
          args: [
            [{_id: 'foo'}],
            {returnStubValue: true}
          ],
        }
      };

      test.equal('object', typeof info);
      test.equal(expectedInfo, info);

      // reset zone for other tests and continue
      Zone.Reporters.add(Zone.longStackTrace);
      Zone.Reporters.remove('test-reporter');
      next();
    });

    TestCollection.remove({_id: 'foo'}, function () {
      TestCollection.insert({_id: 'foo', bar: 'baz'}, function () {
        TestCollection.remove({_id: 'foo'}, function () {
          throw new Error('test-error');
        });
      });
    });
  }
);
