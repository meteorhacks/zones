
Meteor.methods({
  'test-method': function () {
    return;
  }
});

Meteor.publish('test-ready', function () {
  this.ready();
});

Meteor.publish('test-error', function () {
  throw new Meteor.Error();
});
