(function() {
  /*  Prototype JavaScript framework, version 1.7
   *  (c) 2005-2010 Sam Stephenson
   *
   *  Prototype is freely distributable under the terms of an MIT-style license.
   *  For details, see the Prototype web site: http://www.prototypejs.org/
   *
   *--------------------------------------------------------------------------*/

  var Event = new Object();

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

  var host;
  var url = encodeURIComponent(window.location.href);

  function findImages() {
    var imageFinder = document.getElementById('hw-image-finder');
    if (imageFinder) {
      imageFinder.parentNode.removeChild(imageFinder);
    }

    var imagesArray = [];

    var iframes = document.getElementsByTagName('IFRAME');
    var images = document.getElementsByTagName('IMG');
    var dupCache = {};

    function parseImages(images) {
      for (var x = 0; x < images.length; ++x) {
        var img = document.createElement('IMG');
        images[x].setAttribute('width', '');
        images[x].setAttribute('height', '');
        if (images[x].width * images[x].height > 16384
            && !(images[x].src in dupCache) && images[x].style.display != 'none') {
          img.src = images[x].src;
          dupCache[img.src] = 1;
          imagesArray.push(img);
        }
      }
    }
    parseImages(images);
    // tumblr does photosets in iframes
    for (var x = 0; x < iframes.length; ++x) {
      try {
        var iframeImages = iframes[x].contentDocument.getElementsByTagName('IMG');
        parseImages(iframeImages);
      } catch(ex) { }
    }

    images = imagesArray;
    images.sort(function(a, b) {
      var aArea = a.width * a.height;
      var bArea = b.width * b.height;
      if (aArea > bArea)
        return -1;
      if (aArea < bArea)
        return 1;
      return 0;
    });
    var wrapper = document.createElement('DIV');
    wrapper.setAttribute('id', 'hw-image-finder');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.right = '0';
    wrapper.style.height = '200px';
    wrapper.style.padding = '10px';
    wrapper.style.whiteSpace = 'nowrap';
    wrapper.style.overflowX = 'scroll';
    wrapper.style.backgroundColor = '#fff';
    wrapper.style.borderBottom = '1px solid #999';
    wrapper.style.boxShadow = '0px 0px 10px 5px #999';
    wrapper.style.zIndex = '4294967295';

    var selectImage = function(img) {
      // send it off!
      window.open(host + 'dashboard#reblog=' + url + '&img='
          + encodeURIComponent(img.src), '_blank');
    };
    for (var x = 0; x < images.length; ++x) {
      images[x].style.maxHeight = '190px';
      images[x].style.maxWidth = '270px';
      images[x].style.margin = '0';
      images[x].style.padding = '0';
      images[x].style.border = '0';
      images[x].style.marginRight = '10px';
      images[x].style.cursor = 'pointer';
      images[x].onmouseover = function() {
        this.style.outline = '5px solid #0ac';
      };
      images[x].onmouseout = function() {
        this.style.outline = 'none';
      };
      images[x].onclick = function() {
        selectImage(this);
      };
      wrapper.appendChild(images[x]);
    }

    var close = document.createElement('A');
    close.href = '#close-image-finder';
    close.textContent = '×';
    close.style.fontSize = '20px';
    close.style.fontFamily = '"Helvetica Neue",Arial,sans-serif';
    close.style.position = 'fixed';
    close.style.top = '0';
    close.style.right = '5px';
    close.style.textDecoration = 'none';
    close.style.padding = '5px';
    close.style.backgroundColor = '#fff';
    close.style.border = '0';
    close.style.color = '#000';

    var closePicker = function() {
      var imageFinder = document.getElementById('hw-image-finder');
      imageFinder.parentNode.removeChild(imageFinder);
      Event.stopObserving(document, 'keyup', closePicker, false);
      return false;
    };
    var documentKeyUp = function(event) {
      if (event.keyCode == Event.KEY_ESC) {
        closePicker();
      }
    };
    close.onclick = closePicker;
    wrapper.appendChild(close);
    document.body.appendChild(wrapper);
    Event.observe(document, 'keyup', closePicker, false);
  }

  var scripts = document.getElementsByTagName('SCRIPT');
  for (var x = 0; x < scripts.length; ++x) {
    if (scripts[x].src.indexOf('hw_reblog.js') != -1) {
      host = scripts[x].src.match(/.*:\/\/.*?\//)[0];
      break;
    }
  }

  var hasOembedOrOpenGraph = false;
  var links = document.getElementsByTagName('LINK');
  for (var y = 0; y < links.length; ++y) {
    var type = links[y].getAttribute('type');
    if (type == 'text/xml+oembed' || type == 'application/xml+oembed' || type == 'application/json+oembed') {
      hasOembedOrOpenGraph = true;
      break;
    }
  }

  var meta = document.getElementsByTagName('META');
  for (var y = 0; y < links.length; ++y) {
    var property = links[y].getAttribute('property');
    if (property == 'og:title' || property == 'og:image') {
      hasOembedOrOpenGraph = true;
      break;
    }
  }

  if (hasOembedOrOpenGraph) {
    // send it off!
    window.open(host + 'dashboard#reblog=' + url, '_blank');
  } else {
    findImages();
  }
})()
