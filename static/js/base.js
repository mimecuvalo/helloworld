hw = {};

hw.isIE = !!eval('/*@cc_on!@*/false');

// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function f(){ log.history = log.history || []; log.history.push(arguments); if(this.console) { var args = arguments, newarr; args.callee = args.callee.caller; newarr = [].slice.call(args); if (typeof console.log === 'object') log.apply.call(console.log, console, newarr); else console.log.apply(console, newarr);}};

// make it safe to use console.log always
(function(a){function b(){}for(var c="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),d;!!(d=c.pop());){a[d]=a[d]||b;}})
(function(){try{console.log();return window.console;}catch(a){return (window.console={});}}());

hw.baseUri = function() {
  return document.getElementsByTagName('base')[0].href;
};

hw.basePath = function() {
  return document.getElementsByTagName('base')[0].getAttribute('data-path');
};

hw.preventDefault = function(event) {
  if (event.preventDefault) {
    event.preventDefault();
  } else {
    event.returnValue = false;  // workaround ie < 9
  }
};

hw.stopPropagation = function(event) {
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;  // workaround ie < 9
  }
};

hw.$ = function(el) {
  return typeof el == 'string' ? document.getElementById(el) : el;
};

hw.$$ = function(query, doc) {
  doc = doc || document;
  return doc.querySelectorAll(query);
};

hw.$c = function(name, doc) {
  doc = doc || document;
  return doc.querySelector('.' + name + '');
};

hw.firstChildNonText = function(el) {
  if (el.firstChild) {
    return el.firstChild.nodeName == '#text' ? el.firstChild.nextSibling : el.firstChild;
  } else {
    return null;
  }
};

hw.previousSiblingNonText = function(el) {
  if (el.previousSibling) {
    return el.previousSibling.nodeName == '#text' ? el.previousSibling.previousSibling : el.previousSibling;
  } else {
    return null;
  }
};

hw.nextSiblingNonText = function(el) {
  if (el.nextSibling) {
    return el.nextSibling.nodeName == '#text' ? el.nextSibling.nextSibling : el.nextSibling;
  } else {
    return null;
  }
};

hw.addClass = function(el, newClass) {
  el = hw.$(el);
  var classes = el.className.split(/\s+/);
  var found = false;
  for (var x = 0; x < classes.length; ++x) {
    if (classes[x] == newClass) {
      found = true;
      break;
    }
  }
  if (!found) {
    classes.push(newClass);
  }
  el.className = classes.join(' ');
};

hw.removeClass = function(el, oldClass) {
  el = hw.$(el);
  var classes = el.className.split(/\s+/);
  for (var x = classes.length - 1; x >= 0; --x) {
    if (classes[x] == oldClass) {
      classes.splice(x, 1);
      break;
    }
  }
  el.className = classes.join(' ');
};

// remove no-js
hw.removeClass(document.documentElement, 'no-js');

hw.setClass = function(el, className, condition) {
  el = hw.$(el);
  if (condition) {
    hw.addClass(el, className);
  } else {
    hw.removeClass(el, className);
  }
};

hw.hasClass = function(el, className) {
  el = hw.$(el);
  if (el.className == undefined) {
    return false;
  }
  var classes = el.className.split(/\s+/);
  
  for (var x = 0; x < classes.length; ++x) {
    if (classes[x] == className) {
      return true;
    }
  }

  return false;
};

hw.show = function(el) {
  el = hw.$(el);
  if (hw.hasClass(el, 'hw-open') || hw.hasClass(el, 'hw-closed')) {
    hw.removeClass(el, 'hw-closed');
    hw.addClass(el, 'hw-open');
  } else {
    hw.removeClass(el, 'hw-hidden');
    hw.addClass(el, 'hw-shown');
  }
};

hw.hide = function(el) {
  el = hw.$(el);
  if (hw.hasClass(el, 'hw-open') || hw.hasClass(el, 'hw-closed')) {
    hw.removeClass(el, 'hw-open');
    hw.addClass(el, 'hw-closed');
  } else {
    hw.removeClass(el, 'hw-shown');
    hw.addClass(el, 'hw-hidden');
  }
};

hw.isHidden = function(el) {
  el = hw.$(el);
  return hw.hasClass(el, 'hw-hidden') || hw.hasClass(el, 'hw-closed');
};

hw.display = function(el, condition) {
  if (condition) {
    hw.show(el);
  } else {
    hw.hide(el);
  }
};

hw.getCookie = function(name, opt_default) {
  var nameEq = name + '=';
  var parts = String(document.cookie).split(/\s*;\s*/);
  for (var i = 0, part; part = parts[i]; i++) {
    if (part.indexOf(nameEq) == 0) {
      return part.substr(nameEq.length);
    }
  }
  return opt_default;
};

hw.setCookie = function(name, value, opt_maxAge, opt_path, opt_domain) {
  var oneYear = 31536000;
  var date = new Date((new Date).getTime() + oneYear * 1000);
  if (opt_maxAge == 0) {
    date = new Date(1970, 1 /*Feb*/, 1);
  }
  var domainStr = opt_domain ? ';domain=' + opt_domain : '';
  var pathStr = opt_path ? ';path=' + opt_path : '';
  expiresStr = ';expires=' + date.toUTCString();
  document.cookie = name + '=' + value + domainStr + pathStr + expiresStr;
};

hw.eraseCookie = function(name) {
  hw.setCookie(name, '', 0);
};

hw.ajax = function(url, options) {
  this.transport = this.getTransport();
  this.postBody = options.postBody || '';
  this.method = options.method || 'post';
  this.onSuccess = options.onSuccess || null;
  this.onError = options.onError || null;
  this.update = hw.$(options.update) || null;
  this.headers = options.headers || {};
  this.upload = options.upload || null;
  this.onProgress = options.onProgress || null;

  if (!this.upload || (this.upload && this.transport.upload)) {
    this.request(url);
  }
};
hw.ajax.prototype = {
  request: function(url) {
    this.transport.open(this.method, url, true);
    var self = this;
    this.transport.onreadystatechange = function() {
      self.onStateChange();
    };
    if (!this.upload && (this.method == 'post' || this.method == 'put' || this.method == 'delete')) {
      this.transport.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      if (this.transport.overrideMimeType) this.transport.setRequestHeader('Connection', 'close');
    }
    this.transport.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    for (var header in this.headers) {
      this.transport.setRequestHeader(header, this.headers[header]);
    }
    if (this.upload) {
      if (this.onProgress) {
        this.transport.upload.onprogress = this.onProgress;
      }
      if (this.onError) {
        this.transport.upload.onerror = this.onError;
        this.transport.upload.onabort = this.onError;
      }

      this.transport.send(this.upload);
    } else {
      this.transport.send(this.postBody);
    }
  },

  onStateChange: function() {
    if (this.transport.readyState == 4) {
      if (this.isSuccess()) {
        if (this.onSuccess) {
          this.onSuccess(this.transport);
        }
        if (this.update) {
          this.update.innerHTML = this.transport.responseText;
        }
        this.transport.onreadystatechange = function(){};
      } else {
        if (this.onError) {
          this.onError(this.transport);
        }
      }
    }
  },

  isSuccess : function() {
    switch (this.transport.status) {
      case 0:    // Used for local XHR requests
      case 200:  // Http Success
      case 201:  // Http Success
      case 204:  // Http Success - no content
      case 304:  // Http Cache
      case 1223: // Http Success - no content, workaround IE (suck my balls, IE)
        return true;
      default:
        return false;
    }
  },

  getTransport: function() {
    if (window.XMLHttpRequest) return new XMLHttpRequest();
    else if (window.ActiveXObject) return new ActiveXObject('Microsoft.XMLHTTP');
    else return false;
  }
};

/*  Prototype JavaScript framework, version 1.7
 *  (c) 2005-2010 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

if (!window.Event) {
  var Event = new Object();
}

Object.extend = function(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
};
Object.extend(Event, {
  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,

  element: function(event) {
    return event.target || event.srcElement;
  },

  isLeftClick: function(event) {
    return (((event.which) && (event.which == 1)) ||
            ((event.button) && (event.button == 1)));
  },

  pointerX: function(event) {
    return event.pageX || (event.clientX +
      (document.documentElement.scrollLeft || document.body.scrollLeft));
  },

  pointerY: function(event) {
    return event.pageY || (event.clientY +
      (document.documentElement.scrollTop || document.body.scrollTop));
  },

  stop: function(event) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.returnValue = false;
      event.cancelBubble = true;
    }
  },

  // find the first node with the given tagName, starting from the
  // node the event was triggered on; traverses the DOM upwards
  findElement: function(event, tagName) {
    var element = Event.element(event);
    while (element.parentNode && (!element.tagName ||
        (element.tagName.toUpperCase() != tagName.toUpperCase())))
      element = element.parentNode;
    return element;
  },

  observers: false,

  _observeAndCache: function(element, name, observer, useCapture) {
    if (!this.observers) this.observers = [];
    if (element.addEventListener) {
      this.observers.push([element, name, observer, useCapture]);
      element.addEventListener(name, observer, useCapture);
    } else if (element.attachEvent) {
      this.observers.push([element, name, observer, useCapture]);
      element.attachEvent('on' + name, observer);
    }
  },

  unloadCache: function() {
    if (!Event.observers) return;
    for (var i = 0; i < Event.observers.length; i++) {
      Event.stopObserving.apply(this, Event.observers[i]);
      Event.observers[i][0] = null;
    }
    Event.observers = false;
  },

  observe: function(element, name, observer, useCapture) {
    var element = hw.$(element);
    useCapture = useCapture || false;
    this._observeAndCache(element, name, observer, useCapture);
  },

  stopObserving: function(element, name, observer, useCapture) {
    var element = hw.$(element);
    useCapture = useCapture || false;

    if (element.removeEventListener) {
      element.removeEventListener(name, observer, useCapture);
    } else if (element.detachEvent) {
      element.detachEvent('on' + name, observer);
    }
  }
});

hw.testAccelKey = function(event) {
  if (navigator.platform.toLowerCase().indexOf('mac') != -1) {
    return event.metaKey;
  }

  return event.ctrlKey;
};

hw.msgs = {};
hw.setMsg = function(key, msg) {
  hw.msgs[key] = msg;
};
hw.getMsg = function(key, msg) {
  return hw.msgs[key];
};


hw.workaroundPlaceholder = function(event, opt_doc) {
  var doc = opt_doc || document;
  if ('placeholder' in doc.createElement('input')) {
    return;
  }

  var inputs = doc.getElementsByTagName('input');
  for (var x = 0; x < inputs.length; ++x) {
    var input = inputs[x];
    if (input.hasAttribute('placeholder') && !input.value) {
      input.value = input.getAttribute('placeholder');
      var onchange = hw.workaroundPlaceholderHelper(input);
      Event.observe(input, 'focus', onchange, false);
      hw.addClass(input, 'hw-placeholder');
    }
  }
};

hw.workaroundPlaceholderHelper = function(input) {
  var callback = function() {
    input.value = '';
    Event.stopObserving(input, 'change', callback, false);
    hw.removeClass(input, 'hw-placeholder');
  };
  return callback;
};
Event.observe(window, 'load', hw.workaroundPlaceholder, false);

hw.workaroundPlaceholderRemove = function() {
  if ('placeholder' in document.createElement('input')) {
    return;
  }

  var inputs = document.getElementsByTagName('input');
  for (var x = 0; x < inputs.length; ++x) {
    var input = inputs[x];
    if (hw.hasClass(input, 'hw-placeholder')) {
      input.value = '';
    }
  }
};
Event.observe(window, 'unload', hw.workaroundPlaceholderRemove, false);

hw.audioError = function(source) {
  var object = document.createElement('object');

  var audio = source.parentNode;

  object.setAttribute('type', source.getAttribute('type'));
  object.setAttribute('data', source.getAttribute('src'));
  object.setAttribute('width', '200');
  object.setAttribute('height', '16');
  object.setAttribute('autoplay', 'false');

  audio.parentNode.insertBefore(object, audio);
  audio.parentNode.removeChild(audio);
};

hw.videoError = function(source) {
  var video = source.parentNode;
  video.parentNode.removeChild(video);
};
