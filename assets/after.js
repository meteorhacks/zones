
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
  && JSON.stringify) {
  Zone.init();
  restoreOriginals();
}
