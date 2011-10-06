hw = {};

hw.isIE = !!eval('/*@cc_on!@*/false');

if (hw.isIE) {
  document.getElementsByName = function(name, opt_doc) {   // fuck off and die, IE
    var allElements = opt_doc ? opt_doc.getElementsByTagName('*') : document.getElementsByTagName('*');
    var matchingEls = [];
    for (var x = 0; x < allElements.length; ++x) {
      if (allElements[x].getAttribute('name') == name) {
        matchingEls.push(allElements[x]);
      }
    }
    return matchingEls;
  }
}

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

hw.getFirstElementByName = function(name, doc) {
  doc = doc || document;
  return doc.querySelector
      ? doc.querySelector('[name=' + name + ']')
      : document.getElementsByName(name, doc)[0];
};

hw.getElementsByName = function(name, doc) {
  doc = doc || document;
  return doc.querySelectorAll
      ? doc.querySelectorAll('[name=' + name + ']')
      : document.getElementsByName(name, doc);
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
}
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

    if (name == 'keypress' &&
        (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
        || element.attachEvent))
      name = 'keydown';

    this._observeAndCache(element, name, observer, useCapture);
  },

  stopObserving: function(element, name, observer, useCapture) {
    var element = hw.$(element);
    useCapture = useCapture || false;

    if (name == 'keypress' &&
        (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
        || element.detachEvent))
      name = 'keydown';

    if (element.removeEventListener) {
      element.removeEventListener(name, observer, useCapture);
    } else if (element.detachEvent) {
      element.detachEvent('on' + name, observer);
    }
  }
});

hw.login = function(event, el) {
  if (hw.isIE) {  // workaround IE
    return;
  }

  hw.preventDefault(event);

  var login = el || hw.$('hw-login');

  var badTrip = function() {
    login.innerHTML = login.getAttribute('data-failed');
  };

  login.innerHTML = login.getAttribute('data-logging-in');

  navigator.id.getVerifiedEmail(function(assertion) {
    if (assertion) {
      // This code will be invoked once the user has successfully
      // selected an email address they control to sign in with.
      var callback = function(xhr) {
        window.location.reload();
      };
  
      new hw.ajax(hw.baseUri() + 'login',
        { method: 'post',
          postBody: 'assertion=' + encodeURIComponent(assertion),
          headers: { 'X-Xsrftoken' : hw.$('hw-login-form')['_xsrf'].value },
          onSuccess: callback,
          onError: badTrip });
    } else {
      // something went wrong!  the user isn't logged in.
      badTrip();
    }
  });
};

hw.keyNavigation = function(event) {
  var key = event.which ? event.which : event.keyCode;

  if (event.target && (event.target.nodeName == 'TEXTAREA' || event.target.nodeName == 'INPUT')) {
    return;
  }

  if (hw.$('hw-container') && hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  var prev = hw.getFirstElementByName('hw-previous');
  var next = hw.getFirstElementByName('hw-next');
  var topUrl = hw.getFirstElementByName('hw-top');

  switch (key) {
    case Event.KEY_LEFT:
      if (prev && prev.href) {
        if (prev.getAttribute('data-disallow-magic') || !hw.supportsHistory()) {
          window.location.href = prev.href;
        } else {
          hw.navigate(null, prev.href, prev.title);
        }
      }
      break;
    case Event.KEY_RIGHT:
      if (next && next.href) {
        if (next.getAttribute('data-disallow-magic') || !hw.supportsHistory()) {
          window.location.href = next.href;
        } else {
          hw.navigate(null, next.href, next.title);
        }
      }
      break;
    case Event.KEY_UP:
      if (topUrl && topUrl.href) {
        window.location.href = topUrl.href;
      }
      break;
  }
};

Event.observe(window, 'keypress', hw.keyNavigation, false);

hw.supportsHistory = function() {
  return !!(window.history && history.pushState);
};
hw.supportsLocalStorage = function() {
  return 'localStorage' in window && window['localStorage'] !== null;
};

hw.addedFirstUrlToHistory = false;
hw.navigate = function(event, url, title) {
  if (!hw.supportsHistory()) {
    return;  // allow regular links to continue
  }

  if (event) {
    hw.preventDefault(event);  // stop regular links from continuing
  }

  if (!hw.addedFirstUrlToHistory) {
    history.replaceState({ 'title': document.title }, document.title, window.location.href);
    hw.loadedContent[window.location.href] = hw.$('hw-content').innerHTML;
    hw.addedFirstUrlToHistory = true;
  }
  hw.startUrl = null; // XXX chrome, ugh, see below in popstate

  history.pushState({ 'title': title }, title, url);
  document.title = title;

  hw.swapContent(url, title);
};

hw.swapContent = function(url, title) {
  var onSuccess = function(xhr, preloadedContent) {
    hw.addClass(hw.$('hw-content'), 'hw-invisible');
    var fn = function() {
      hw.$('hw-content').innerHTML = preloadedContent || (xhr ? xhr.responseText : '');
      hw.loadedContent[url] = preloadedContent || (xhr ? xhr.responseText : '');
      hw.removeClass(hw.$('hw-content'), 'hw-invisible');
      hw.preloadPreviousContent();
    };
    setTimeout(fn, 100);
  };

  var onError = function() {
    window.location.href = url;
  };

  if (hw.loadedContent[url]) {
    onSuccess(null, hw.loadedContent[url]);
  } else {
    new hw.ajax(url,
          { method: 'get',
            onSuccess: onSuccess,
            onError: onError });
  }
};

hw.loadedContent = {};

hw.preloadPreviousContent = function() {
  var prev = hw.getFirstElementByName('hw-previous');
  if (!hw.supportsHistory() || !prev || !prev.href || prev.getAttribute('data-disallow-magic')) {
    return;
  }

  var url = prev.href;

  if (hw.loadedContent[url]) {
    return;
  }

  if (!hw.$('hw-preloaded-content')) {
    var el = document.createElement('div');
    el.id = "hw-preloaded-content";
    document.body.appendChild(el);
  }

  var onSuccess = function(xhr) {
    hw.loadedContent[url] = xhr.responseText;
    hw.$('hw-preloaded-content').innerHTML = xhr.responseText;
  };

  new hw.ajax(url,
        { method: 'get',
          onSuccess: onSuccess });
};

Event.observe(window, 'load', hw.preloadPreviousContent, false);
hw.startUrl = window.location.href;
Event.observe(window, 'popstate', function(e) {
  if (hw.startUrl == window.location.href) { // XXX chrome sends a popstate event onload too
    hw.startUrl = null;
    return;
  }

  hw.swapContent(window.location.href);
  if (e.state) {
    document.title = e.state['title'];
  }
}, false);

hw.msgs = {};
hw.setMsg = function(key, msg) {
  hw.msgs[key] = msg;
}
hw.getMsg = function(key, msg) {
  return hw.msgs[key];
}

hw.loadMore = function(url, offset, opt_feed_id) {
  this.url = url;
  this.url = this.url.lastIndexOf('/') == this.url.length - 1 ? this.url.substring(0, this.url.length - 1) : this.url;  // remove slash
  this.url = this.url.replace(/\/page\/\d+/g, '');
  this.offset = offset;
  this.feed = opt_feed_id ? hw.$(opt_feed_id) : hw.$('hw-content');
};
hw.loadMore.prototype = {
  processing : false,
  done : false,

  onScroll : function() {
    var currentOffset = this.offset;

    if (hw.supportsHistory()) {
      while (hw.$('hw-feed-page-' + (this.offset + 1))
        && (document.body.parentNode.scrollTop || document.body.scrollTop) > hw.$('hw-feed-page-' + (this.offset + 1)).getBoundingClientRect().top) {
        ++this.offset;
      }
      while (hw.$('hw-feed-page-' + this.offset)
        && (document.body.parentNode.scrollTop || document.body.scrollTop) < hw.$('hw-feed-page-' + this.offset).getBoundingClientRect().top) {
        --this.offset;
      }

      var url = this.url + (this.offset == 1 ? '' : '/page/' + this.offset);
      if (currentOffset != this.offset && this.offset != 0) {
        history.replaceState({ 'title': document.title }, document.title, url);
      }
    }

    var self = this;
    var insertData = function(xhr) {
      ++self.offset;

      var fn = function() {
        self.processing = false;
      };
      setTimeout(fn, 3000);

      hw.$('hw-loading').parentNode.removeChild(hw.$('hw-loading'));
      self.feed.innerHTML += '<a id="hw-feed-page-' + self.offset + '"></a>' + xhr.responseText;

      if (hw.supportsHistory()) {
        var url = self.url + '/page/' + (self.offset);
        history.replaceState({ 'title': document.title }, document.title, url);
      }
    };

    var badTrip = function(xhr) {
      hw.$('hw-loading').parentNode.removeChild(hw.$('hw-loading'));

      if (xhr.status = 404) {
        self.done = true;
      } else {
        var fn = function() {
          self.processing = false;
        };
        setTimeout(fn, 3000);
      }
    };

    if (!this.done && !this.processing &&
        (document.height || document.body.parentNode.scrollHeight) -
        (document.body.parentNode.scrollTop || document.body.scrollTop) < (document.body.parentNode.clientHeight || document.body.clientHeight) * 3) {
      this.processing = true;
      this.feed.innerHTML += '<div id="hw-loading">' + hw.getMsg('loading') + '</div>';

      new hw.ajax(this.url + '/page/' + (this.offset + 1),
        { method: 'get',
          onSuccess: insertData,
          onError: badTrip });
    }
  }
};

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

hw.mediaSlideshow = function(el, dir) {
  var first;
  var current;
  var last;
  var traversal = el.parentNode.firstChild;

  while (traversal) {
    if (hw.hasClass(traversal, 'hw-media-slideshow-item')) {
      if (!first) {
        first = traversal;
      }
      if (!hw.isHidden(traversal)) {
        current = traversal;
      }
      last = traversal;
    }
    traversal = traversal.nextSibling;
  }
  if (dir == 1) {
    var next = hw.nextSiblingNonText(current);
    if (next && hw.hasClass(next, 'hw-media-slideshow-item')) {
      hw.show(next);
    } else {
      hw.show(first);
    }
    hw.hide(current);
  } else {
    var previous = hw.previousSiblingNonText(current);
    if (previous && hw.hasClass(previous, 'hw-media-slideshow-item')) {
      hw.show(previous);
    } else {
      hw.show(last);
    }
    hw.hide(current);
  }
};

hw.slideshowCurrent = null;
hw.slideshowPaused = true;
hw.slideshowInterval = null;
hw.slideshowSetup = function() {
  var traversal = hw.$('hw-content').firstChild;

  while (traversal) {
    if (traversal.nodeName == 'SECTION') {
      hw.hide(traversal);
      hw.addClass(traversal, 'hw-hidden-transition');
    }
    traversal = traversal.nextSibling;
  }

  hw.hide('hw-user');
  hw.slideshow(null, 0);

  hw.createAutoload = false;

  Event.observe(document, 'keypress', hw.slideshowKeys, false);
  Event.observe(document, 'click', hw.slideshowClick, false);

  hw.slideshowPause();
};

hw.slideshow = function(dir, specificPage, show_last) {
  if (!hw.hasClass('hw-content', 'hw-presentation')) {
    return;
  }

  var first;
  var current;
  var last;
  var specific;
  var traversal = hw.$('hw-content').firstChild;
  var index = 0;

  while (traversal) {
    if (traversal.nodeName == 'SECTION') {
      if (!first) {
        first = traversal;
      }
      if (!hw.isHidden(traversal)) {
        current = traversal;
      }
      last = traversal;
      if (index == specificPage) {
        specific = traversal;
      }
      ++index;
    }
    traversal = traversal.nextSibling;
  }
  if (show_last) {
    specific = last;
  }
  if (specificPage != undefined || show_last) {
    hw.show(specific);
    hw.slideshowCurrent = specific;
    if (current) {
      hw.hide(current);
    }
  } else if (dir == 1) {
    var next = hw.nextSiblingNonText(current);
    if (next && next.nodeName == 'SECTION') {
      hw.show(next);
      hw.slideshowCurrent = next;
    } else {
      hw.show(first);
      hw.slideshowCurrent = first;
    }
    hw.hide(current);
  } else if (dir == -1) {
    var previous = hw.previousSiblingNonText(current);
    if (previous && previous.nodeName == 'SECTION') {
      hw.show(previous);
      hw.slideshowCurrent = previous;
    } else {
      hw.show(last);
      hw.slideshowCurrent = last;
    }
    hw.hide(current);
  }
};

hw.slideshowTogglePlain = function(event) {
  hw.stopPropagation(event);

  var plain = hw.hasClass('hw-content', 'hw-presentation');
  hw.setClass('hw-content', 'hw-presentation', !plain);
  hw.display('hw-user', plain);
  hw.$('hw-content').style.position = plain ? 'static' : 'fixed';

  var traversal = hw.$('hw-content').firstChild;
  while (traversal) {
    if (traversal.nodeName == 'SECTION') {
      hw.display(traversal, plain);
    }
    traversal = traversal.nextSibling;
  }

  hw.show(hw.slideshowCurrent);
};

hw.slideshowKeys = function(event) {
  var key = event.which ? event.which : event.keyCode;
  hw.slideshowPause(null, true);
  switch (key) {
    case 10: // return
    case 13: // enter
    case 32: // spacebar
    case 34: // page down
    case 39: // rightkey
    case 40: // downkey
      hw.slideshow(1);
      break;
    case 33: // page up
    case 37: // leftkey
    case 38: // upkey
      hw.slideshow(-1);
      break;
    case 36: // home
      hw.slideshow(null, 0);
      break;
    case 35: // end
      hw.slideshow(null, null, true);
      break;
    case 99: // c
      hw.slideshowTogglePlain(event);
      break;
  }
};

hw.slideshowClick = function(event) {
  var target = event.target ? event.target : event.srcElement;
  if (target.nodeName != 'A' && target.parentNode.nodeName != 'A') {
    hw.slideshowPause(null, true);
    hw.slideshow(1);
  }
};

hw.slideshowControl = function(event, dir, specificPage) {
  hw.preventDefault(event);
  hw.stopPropagation(event);
  hw.slideshow(dir, specificPage);
};

hw.slideshowPause = function(event, forcePause) {
  if (event) {
    hw.preventDefault(event);
    hw.stopPropagation(event);
  }

  if (!forcePause && hw.slideshowPaused) {
    hw.slideshowInterval = setInterval(function() { hw.slideshow(1) }, 5000);
  } else {
    clearInterval(hw.slideshowInterval);
  }
  hw.$('hw-slideshow-pause').innerHTML = hw.$('hw-slideshow-pause').getAttribute('data-' + (!forcePause && hw.slideshowPaused ? 'pause' : 'play'));
  hw.slideshowPaused = forcePause || !hw.slideshowPaused;
};

hw.selectInputField = null;
hw.selectFileCallback = null;
hw.selectFile = function(inputField, callback, section) {
  hw.selectInputField = inputField;
  hw.selectFileCallback = callback;
  window.open(hw.baseUri() + 'media?standalone=true' + (section ? '&initial_section=' + section : ''), null, "height=300,width=630");
};

hw.selectFileFinish = function(filePath) {
  hw.selectInputField.value = filePath;
  if (hw.selectFileCallback) {
    hw.selectFileCallback();
  }
};

hw.cart = null;
hw.addToCart = function(el) {
  var cart = hw.getCart();

  var id = el.getAttribute('data-content-id');
  var url = el.getAttribute('data-content-url');
  var title = el.getAttribute('data-content-title');
  var thumb = el.getAttribute('data-content-thumb');
  var price = el.getAttribute('data-content-price');
  var quantity = 1;

  var found = false;
  for (var x = 0; x < cart.length; ++x) {
    if (cart[x]['id'] == id) {
      ++cart[x]['quantity'];
      found = true;
      break;
    }
  }

  if (!found) {
    cart.push({ 'id': id,
                'url': url,
                'title': title,
                'thumb': thumb,
                'price': price,
                'quantity': quantity });
  }

  hw.saveCart(cart);

  hw.updateCartCount();
};

hw.updateCartCount = function() {
  var cart = hw.getCart();
  hw.$('hw-cart-item-count').innerHTML = cart.length;
};

hw.updateCartTotal = function() {
  var cart = hw.getCart();
  var total = 0;
  for (var x = 0; x < cart.length; ++x) {
    total += cart[x]['price'] * cart[x]['quantity'];
  }
  hw.$('hw-cart-total').innerHTML = total.toFixed(2);
};

hw.updateCartQuantity = function(el) {
  var quantity = parseInt(el.value);

  var cart = hw.getCart();
  for (var x = 0; x < cart.length; ++x) {
    if (cart[x]['id'] == el.getAttribute('data-cart-id')) {
      if (quantity <= 0) {
        cart.splice(x, 1);
      } else {
        cart[x]['quantity'] = quantity;
      }
      break;
    }
  }

  hw.saveCart(cart);

  if (quantity <= 0) {
    var item = el.parentNode.parentNode.parentNode;
    item.parentNode.removeChild(item);
  }

  hw.updateCartCount();
  hw.updateCartTotal();
};

hw.getCart = function() {
  var chunks = parseInt(hw.getCookie('cart_chunks', 0));

  var cart = "";
  for (var x = 0; x < chunks; ++x) {
    cart += hw.getCookie('cart_chunk_' + x, "");
  }

  cart = cart.split('|');
  for (var x = cart.length; x >= 0; --x) {
    if (!cart[x]) {
      cart.splice(x, 1);
      continue;
    }
    var args = cart[x].split('&');
    cart[x] = {};
    for (var y = 0; y < args.length; ++y) {
      var arg = args[y].split('=');
      cart[x][arg[0]] = decodeURIComponent(arg[1]);
    }
  }

  return cart;
};

hw.saveCart = function(cart) {
  for (var x = 0; x < cart.length; ++x) {
    var cartQuery = "";
    for (var arg in cart[x]) {
      if (cartQuery) {
        cartQuery += '&';
      }
      cartQuery += arg + '=' + encodeURIComponent(cart[x][arg]);
    }
    cart[x] = cartQuery;
  }
  cart = cart.join('|');

  var cart_chunks = 0;
  for (var x = 0; x < cart.length; x += 4000) {
    hw.setCookie('cart_chunk_' + (x / 4000), cart.substring(x, x + 4000), -1, hw.basePath());
    ++cart_chunks;
  }

  hw.setCookie('cart_chunks', cart_chunks, -1, hw.basePath());
};

hw.viewCart = function() {
  hw.show('hw-cart-wrapper');
  var cartDiv = hw.$('hw-cart');
  cartDiv.innerHTML = '';

  var cart = hw.getCart();
  var template = hw.$('hw-cart-template');

  for (var x = 0; x < cart.length; ++x) {
    var div = document.createElement('div');
    div.innerHTML = template.innerHTML;
    for (var arg in cart[x]) {
      var re = new RegExp("\\$" + arg, "g");
      var value = arg == 'price' ? Number(cart[x][arg]).toFixed(2) : cart[x][arg];
      value = arg == 'thumb' ? 'src="' + value + '"' : value;
      div.innerHTML = div.innerHTML.replace(re, value);
    }
    cartDiv.appendChild(div);
  }

  hw.updateCartTotal();
};

hw.checkoutClose = function(event) {
  if (event) {
    hw.preventDefault(event);
  }
  hw.hide('hw-cart-wrapper');
};

hw.clearCart = function() {
  var chunks = parseInt(hw.getCookie('cart_chunks', 0));

  for (var x = 0; x < chunks; ++x) {
    hw.eraseCookie('cart_chunk_' + x);
  }
  hw.eraseCookie('cart_chunks');

  hw.updateCartCount();
  hw.checkoutClose();
};

// modified from simplecartjs which is under an MIT License
// /****************************************************************************
// Copyright (c) 2011 The Wojo Group

// thewojogroup.com
// simplecartjs.com
// http://github.com/thewojogroup/simplecart-js/tree/master
hw.checkoutPaypal = function(email, currency) {
  var form = document.createElement("form")
  var counter = 1;

  form.style.display = "none";
  form.method = "GET";
  form.action = true ? "https://www.sandbox.paypal.com/cgi-bin/webscr" : "https://www.paypal.com/cgi-bin/webscr";
  form.acceptCharset = "utf-8";

  // setup hidden fields
  form.appendChild(hw.createHiddenElement("cmd", "_cart"));
  form.appendChild(hw.createHiddenElement("rm", "0"));
  form.appendChild(hw.createHiddenElement("upload", "1"));
  form.appendChild(hw.createHiddenElement("business", email));
  form.appendChild(hw.createHiddenElement("currency_code", currency));

  //if (taxRate) {
  //  form.appendChild(hw.createHiddenElement("tax_cart", me.taxCost));
  //}

  //if( me.shipping() !== 0){
  //  form.appendChild(me.createHiddenElement("handling_cart",  me.shippingCost ));
  //}

  form.appendChild(hw.createHiddenElement("return", window.location.href + '?checkout_success=1'));

  //if( me.cancelUrl ){
  //form.appendChild(me.createHiddenElement("cancel_return",  me.cancelUrl ));
  //}

  var cart = hw.getCart();
  for (var x = 0; x < cart.length; ++x) {
    var item = cart[x];
    form.appendChild(hw.createHiddenElement("item_name_" + counter, item['title'] + ' (' + item['id'] + ')'));
    form.appendChild(hw.createHiddenElement("quantity_" + counter, item['quantity']));
    form.appendChild(hw.createHiddenElement("amount_" + counter, item['price']));
    form.appendChild(hw.createHiddenElement("item_number_" + counter, counter) );

    var option_count = 0;

    //form.appendChild( me.createHiddenElement( "on" + option_count + "_"	+ counter, 	field ) );
    //form.appendChild( me.createHiddenElement( "os" + option_count + "_"	+ counter, 	value ) );
    //option_count++;

    form.appendChild(hw.createHiddenElement("option_index_" + counter, option_count));

    ++counter;
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

};

hw.createHiddenElement = function(name, value) {
  var element = document.createElement("input");
  element.type = "hidden";
  element.name = name;
  element.value = value;
  return element;
};


hw.checkoutBarter = function(email, subject) {
  var body = "";

  var cart = hw.getCart();
  for (var x = 0; x < cart.length; ++x) {
    body += '<a href="' + hw.baseUri() + cart[x]['url'] + '">'
          + cart[x]['title'] + ' (' + cart[x]['id'] + '):</a> '
          + Number(cart[x]['price']).toFixed(2) + ' x' + cart[x]['quantity']
          + '\n\n';
  }
  body += hw.$('hw-cart-total-wrapper').innerHTML;

  window.location.href =
    'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
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

hw.commentSubmit = function() {
  var form = hw.getFirstElementByName('hw-comment-form');
  var comment = hw.getFirstElementByName('hw-comment-input');
  var localId = comment.getAttribute('data-local-id');
  var thread = comment.hasAttribute('data-thread') ? comment.getAttribute('data-thread') : '';
  var threadUser = comment.hasAttribute('data-thread-user') ? comment.getAttribute('data-thread-user') : '';

  var callback = function(xhr) {
    comment.value = '';
    window.location.reload();
  };

  var badTrip = function(xhr) {
    alert(form.getAttribute('data-error'));
  };

  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='         + encodeURIComponent('comment')
             + '&local_id='   + encodeURIComponent(localId)
             + '&thread='     + encodeURIComponent(thread)
             + '&thread_user=' + encodeURIComponent(threadUser)
             + '&comment='    + encodeURIComponent(comment.value),
      headers: { 'X-Xsrftoken' : form['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};
