
// initialize zone only if the browser is compatible
// zone.js requires following ES5 features (or shims)
if(  window.JSON
  && Object.create
  && Object.defineProperties
  && Object.defineProperty
  && Object.freeze
  && Object.getOwnPropertyDescriptor
  && Object.keys
  && Array.prototype.forEach
  && Array.prototype.map
  && JSON.parse
  && JSON.stringify
  && isBrowserAllowed()) {
  Zone.init();
  Zone.inited = true;
  restoreOriginals();
}

function isBrowserAllowed() {
  var ieVersion = isIE();
  if(!ieVersion) {
    return true;
  } else {
    return ieVersion > 9;
  }
}

function isIE () {
  var myNav = navigator.userAgent.toLowerCase();
  return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
}