
Meteor.methods({
  'test-method': function (msg) {
    throw new Meteor.Error('~ test method error ~ '+msg+' ~');
  }
});
