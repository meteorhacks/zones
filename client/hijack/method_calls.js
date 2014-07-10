
/**
 * Hijack Meteor.call
 * Replace given callback function with a zoned version
 */

var original_Meteor_call = Meteor.call;

Meteor.call = function() {
  var args = Array.prototype.slice.call(arguments);
  var callback = args[args.length - 1];
  if(typeof callback === 'function') {
    var zonedCallback = zone.bindOnce(callback);
    args[args.length - 1] = zonedCallback;
  };
  return original_Meteor_call.apply(this, args);
};
