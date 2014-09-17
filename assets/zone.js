'use strict';

// Based on https://github.com/angular/zone.js/commit/74947b6f509bc7272fc3d2de562dbd8e981b00a1
//
// Changes from original
//  * Zone.bindArgumentsOnce now accepts a second param called ownerInfo
//      it will be passed as zone.bind(fn, false, ownerInfo)
//  * In most of the patchs, ownerInfo has been generated to get some info
//      about the zone and which created it
//  * In some places zone.bind has been called with zone.bind(fn, false, ownerInfo)
//  * Zone.init() has been removed from this script to support extending
//      zones via some other script
//  * Add some html element info to ownerInfo of event listeners

function Zone(parentZone, data) {
  var zone = (arguments.length) ? Object.create(parentZone) : this;

  zone.parent = parentZone;

  Object.keys(data || {}).forEach(function(property) {

    var _property = property.substr(1);

    // augment the new zone with a hook decorates the parent's hook
    if (property[0] === '$') {
      zone[_property] = data[property](parentZone[_property] || function () {});

    // augment the new zone with a hook that runs after the parent's hook
    } else if (property[0] === '+') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          var result = Zone._apply(parentZone[_property], this, arguments);
          Zone._apply(data[property], this, arguments);
          return result;
        };
      } else {
        zone[_property] = data[property];
      }

    // augment the new zone with a hook that runs before the parent's hook
    } else if (property[0] === '-') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          Zone._apply(data[property], this, arguments);
          return Zone._apply(parentZone[_property], this, arguments);
        };
      } else {
        zone[_property] = data[property];
      }

    // set the new zone's hook (replacing the parent zone's)
    } else {
      zone[property] = (typeof data[property] === 'object') ?
                        JSON.parse(JSON.stringify(data[property])) :
                        data[property];
    }
  });

  return zone;
}


Zone.prototype = {
  constructor: Zone,

  fork: function (locals) {
    this.onZoneCreated();
    return new Zone(this, locals);
  },

  bind: function (fn, skipEnqueue) {
    skipEnqueue || this.enqueueTask(fn);
    var zone = this.fork();
    return function zoneBoundFn() {
      return zone.run(fn, this, arguments);
    };
  },

  bindOnce: function (fn) {
    var boundZone = this;
    return this.bind(function () {
      var result = Zone._apply(fn, this, arguments);
      boundZone.dequeueTask(fn);
      return result;
    });
  },

  run: function run (fn, applyTo, applyWith) {
    applyWith = applyWith || [];

    var oldZone = window.zone,
        result;

    window.zone = this;

    try {
      this.beforeTask();
      result = Zone._apply(fn, applyTo, applyWith);
    } catch (e) {
      if (zone.onError) {
        zone.onError(e);
        this.afterTask();
        window.zone = oldZone;
      } else {
        this.afterTask();
        window.zone = oldZone;
        throw e;
      }
    }
    return result;
  },

  beforeTask: function () {},
  onZoneCreated: function () {},
  afterTask: function () {},
  enqueueTask: function () {},
  dequeueTask: function () {}
};


Zone.patchSetClearFn = function (obj, fnNames) {
  fnNames.map(function (name) {
    return name[0].toUpperCase() + name.substr(1);
  }).
  forEach(function (name) {
    var setName = 'set' + name;
    var clearName = 'clear' + name;
    var delegate = obj[setName];

    if (delegate) {
      var ids = {};

      if (setName === 'setInterval') {
        zone[setName] = function (fn) {
          var id;
          arguments[0] = function () {
            delete ids[id];
            return Zone._apply(fn, this, arguments);
          };
          var ownerInfo = {type: setName, timeout: arguments[1]};
          var args = Zone.bindArguments(arguments, ownerInfo);
          id = Zone._apply(delegate, obj, args);
          ids[id] = true;
          return id;
        };
      } else {
        zone[setName] = function (fn) {
          var id;
          arguments[0] = function () {
            delete ids[id];
            return Zone._apply(fn, this, arguments);
          };
          var ownerInfo = {type: setName, timeout: arguments[1]};
          var args = Zone.bindArgumentsOnce(arguments, ownerInfo);
          id = Zone._apply(delegate, obj, args);
          ids[id] = true;
          return id;
        };
      }


      obj[setName] = function () {
        return Zone._apply(zone[setName], this, arguments);
      };

      var clearDelegate = obj[clearName];

      zone[clearName] = function (id) {
        if (ids[id]) {
          delete ids[id];
          zone.dequeueTask();
        }
        return Zone._apply(clearDelegate, this, arguments);
      };

      obj[clearName] = function () {
        return Zone._apply(zone[clearName], this, arguments);
      };
    }
  });
};

Zone.bindArguments = function (args, ownerInfo) {
  for (var i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') {
      args[i] = zone.bind(args[i], false, ownerInfo);
    }
  }
  return args;
};


Zone.bindArgumentsOnce = function (args, ownerInfo) {
  for (var i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') {
      args[i] = zone.bindOnce(args[i], ownerInfo);
    }
  }
  return args;
};

Zone.patchProperty = function (obj, prop) {
  var desc = Object.getOwnPropertyDescriptor(obj, prop) || {
    enumerable: true,
    configurable: true
  };

  // A property descriptor cannot have getter/setter and be writable
  // deleting the writable and value properties avoids this error:
  //
  // TypeError: property descriptors must not specify a value or be writable when a
  // getter or setter has been specified
  delete desc.writable;
  delete desc.value;

  // substr(2) cuz 'onclick' -> 'click', etc
  var eventName = prop.substr(2);
  var _prop = '_' + prop;

  desc.set = function (fn) {
    if (this[_prop]) {
      this.removeEventListener(eventName, this[_prop]);
    }

    if (typeof fn === 'function') {
      this[_prop] = fn;
      this.addEventListener(eventName, fn, false);
    } else {
      this[_prop] = null;
    }
  };

  desc.get = function () {
    return this[_prop];
  };

  Object.defineProperty(obj, prop, desc);
};

Zone.patchProperties = function (obj, properties) {

  (properties || (function () {
      var props = [];
      for (var prop in obj) {
        props.push(prop);
      }
      return props;
    }()).
    filter(function (propertyName) {
      return propertyName.substr(0,2) === 'on';
    })).
    forEach(function (eventName) {
      Zone.patchProperty(obj, eventName);
    });
};

Zone.patchEventTargetMethods = function (obj, thing) {
  var addDelegate = obj.addEventListener;
  obj.addEventListener = function (eventName, fn) {
    // Add some element info to ownerInfo in order to make it easier to identify
    // to which html element this event listener was attached to

    function getName(element) {
      if(element === window) {
        return 'window';
      } else if(element) {
        return element.localName || element.nodeName;
      } else {
        return "no element";
      }
    }

    var ownerInfo = {
      type: thing + ".addEventListener",
      event: eventName,
      name: getName(this)
    };

    // `this` can be undefined
    if(this && this.attributes) {
      ownerInfo.attributes = {};
      var attributesArray = Array.prototype.slice.call(this.attributes);
      attributesArray.forEach(function (attr) {
        ownerInfo.attributes[attr.name] = attr.value;
      });
    }

    fn._bound = fn._bound || {};
    arguments[1] = fn._bound[eventName] = zone.bind(fn, false, ownerInfo);
    return Zone._apply(addDelegate, this, arguments);
  };

  var removeDelegate = obj.removeEventListener;
  obj.removeEventListener = function (eventName, fn) {
    if(arguments[1]._bound && arguments[1]._bound[eventName]) {
      arguments[1] = arguments[1]._bound[eventName];
    }
    var result = Zone._apply(removeDelegate, this, arguments);
    zone.dequeueTask(fn);
    return result;
  };
};

Zone.patch = function patch () {
  Zone.patchSetClearFn(window, [
    'timeout',
    'interval',
    'immediate'
  ]);

  // patched properties depend on addEventListener, so this needs to come first
  if (window.EventTarget) {
    Zone.patchEventTargetMethods(window.EventTarget.prototype, 'EventTarget');

  // Note: EventTarget is not available in all browsers,
  // if it's not available, we instead patch the APIs in the IDL that inherit from EventTarget
  } else {
    [ 'ApplicationCache',
      'EventSource',
      'FileReader',
      'InputMethodContext',
      'MediaController',
      'MessagePort',
      'Node',
      'Performance',
      'SVGElementInstance',
      'SharedWorker',
      'TextTrack',
      'TextTrackCue',
      'TextTrackList',
      'WebKitNamedFlow',
      'Window',
      'Worker',
      'WorkerGlobalScope',
      'XMLHttpRequestEventTarget',
      'XMLHttpRequestUpload'
    ].
    filter(function (thing) {
      return window[thing];
    }).
    map(function (thing) {
      return {
        thing: thing,
        prototype: window[thing].prototype
      };
    }).
    forEach(function(info) {
      Zone.patchEventTargetMethods(info.prototype, info.thing);
    });
  }

  if (Zone.canPatchViaPropertyDescriptor()) {
    Zone.patchViaPropertyDescriptor();
  } else {
    Zone.patchViaCapturingAllTheEvents();
    Zone.patchClass('XMLHttpRequest');
  }
};

//
Zone.canPatchViaPropertyDescriptor = function () {
  Object.defineProperty(HTMLElement.prototype, 'onclick', {
    get: function () {
      return true;
    }
  });
  var elt = document.createElement('div');
  var result = !!elt.onclick;
  Object.defineProperty(HTMLElement.prototype, 'onclick', {});
  return result;
};

// for browsers that we can patch the descriptor:
// - eventually Chrome once this bug gets resolved
// - Firefox
Zone.patchViaPropertyDescriptor = function () {
  Zone.patchProperties(HTMLElement.prototype, Zone.onEventNames);
  Zone.patchProperties(XMLHttpRequest.prototype);
};

// Whenever any event fires, we check the event target and all parents
// for `onwhatever` properties and replace them with zone-bound functions
// - Chrome (for now)
Zone.patchViaCapturingAllTheEvents = function () {
  Zone.eventNames.forEach(function (property) {
    var onproperty = 'on' + property;
    document.addEventListener(property, function (event) {
      var elt = event.target, bound;
      while (elt) {
        if (elt[onproperty] && !elt[onproperty]._unbound) {
          var ownerInfo = {type: "document.on" + property};
          bound = zone.bind(elt[onproperty], false, ownerInfo);
          bound._unbound = elt[onproperty];
          elt[onproperty] = bound;
        }
        elt = elt.parentElement;
      }
    }, true);
  });
};

// wrap some native API on `window`
Zone.patchClass = function (className) {
  var OriginalClass = window[className];
  if (!OriginalClass) {
    return;
  }
  window[className] = function () {
    var a = Zone.bindArguments(arguments);
    switch (a.length) {
      case 0: this._o = new OriginalClass(); break;
      case 1: this._o = new OriginalClass(a[0]); break;
      case 2: this._o = new OriginalClass(a[0], a[1]); break;
      case 3: this._o = new OriginalClass(a[0], a[1], a[2]); break;
      case 4: this._o = new OriginalClass(a[0], a[1], a[2], a[3]); break;
      default: throw new Error('what are you even doing?');
    }
  };

  var instance = new OriginalClass(className.substr(-16) === 'MutationObserver' ? function () {} : undefined);

  var prop;
  for (prop in instance) {
    (function (prop) {
      if (typeof instance[prop] === 'function') {
        window[className].prototype[prop] = function () {
          return Zone._apply(this._o[prop], this._o, arguments);
        };
      } else {
        Object.defineProperty(window[className].prototype, prop, {
          set: function (fn) {
            if (typeof fn === 'function') {
              this._o[prop] = zone.bind(fn);
            } else {
              this._o[prop] = fn;
            }
          },
          get: function () {
            return this._o[prop];
          }
        });
      }
    }(prop));
  };
};

Zone.eventNames = 'copy cut paste abort blur focus canplay canplaythrough change click contextmenu dblclick drag dragend dragenter dragleave dragover dragstart drop durationchange emptied ended input invalid keydown keypress keyup load loadeddata loadedmetadata loadstart mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup pause play playing progress ratechange reset scroll seeked seeking select show stalled submit suspend timeupdate volumechange waiting mozfullscreenchange mozfullscreenerror mozpointerlockchange mozpointerlockerror error webglcontextrestored webglcontextlost webglcontextcreationerror'.split(' ');

Zone.onEventNames = [];
for(var i=0, l=Zone.eventNames.length; i<l; ++i) {
  Zone.onEventNames[i] = 'on' + Zone.eventNames[i];
}

Zone.init = function init () {
  if (typeof module !== 'undefined' && module && module.exports) {
    module.exports = new Zone();
  } else {
    window.zone = new Zone();
  }
  Zone.patch();
};

Zone._apply = function apply(f, c, a) {
  if(typeof f !== 'function') {
    return;
  }

  var a = [].slice.call(a);
  switch (a.length) {
    case 0: return f.call(c);
    case 1: return f.call(c, a[0]);
    case 2: return f.call(c, a[0], a[1]);
    case 3: return f.call(c, a[0], a[1], a[2]);
    case 4: return f.call(c, a[0], a[1], a[2], a[3]);
    case 5: return f.call(c, a[0], a[1], a[2], a[3], a[4]);
    case 6: return f.call(c, a[0], a[1], a[2], a[3], a[4], a[5]);
    case 7: return f.call(c, a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
    default: return f.apply(c, a);
  }
}

Zone.collectAllStacks = true;
