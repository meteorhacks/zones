
Template.homepage.rendered = function () {
  callMethod('rendered');
};

Template.homepage.events({
  'click #call-method': function testEventHandler (e) {
    callMethod('event');
  }
});

function callMethod (n) {
  Meteor.call('test-method', n, function testCallback (error, result) {
    throw error;
  });
}
