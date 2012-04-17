hw.login = function(event, el) {
  hw.preventDefault(event);

  var login = el || hw.$('hw-login');

  var badTrip = function() {
    login.innerHTML = login.getAttribute('data-failed');
  };

  login.innerHTML = login.getAttribute('data-logging-in');

  navigator.id.get(function(assertion) {
    if (assertion !== null) {
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
  if (document.activeElement && document.activeElement.hasAttribute('contenteditable')) {
    return;
  }

  var key = event.which ? event.which : event.keyCode;

  if (event.target && (event.target.nodeName == 'TEXTAREA' || event.target.nodeName == 'INPUT')) {
    return;
  }

  if (hw.$('hw-container') && hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  var prev = hw.$c('hw-previous');
  var next = hw.$c('hw-next');
  var topUrl = hw.$c('hw-top');
  var neighbors = hw.$c('hw-neighbors');
  if (!neighbors) {
    return;
  }
  var reverse = hw.hasClass(neighbors, 'hw-reverse-sort');

  if ((key == Event.KEY_RIGHT && !reverse) || (key == Event.KEY_LEFT && reverse)) {
    if (prev && prev.href) {
      if (prev.getAttribute('data-disallow-magic') || !hw.supportsHistory()) {
        window.location.href = prev.href;
      } else {
        hw.navigate(null, prev.href, prev.title);
      }
    }
  } else if ((key == Event.KEY_LEFT && !reverse) || (key == Event.KEY_RIGHT && reverse)) {
    if (next && next.href) {
      if (next.getAttribute('data-disallow-magic') || !hw.supportsHistory()) {
        window.location.href = next.href;
      } else {
        hw.navigate(null, next.href, next.title);
      }
    }
  } else if (key == Event.KEY_UP) {
    if (topUrl && topUrl.href) {
      window.location.href = topUrl.href;
    }
  }
};

Event.observe(window, 'keyup', hw.keyNavigation, false);

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

  title = title.replace(/&quot;/g, '"');

  if (!hw.addedFirstUrlToHistory) {
    var isAlbum = !!hw.$c('hw-album');
    history.replaceState({ 'title': title, 'isAlbum': isAlbum }, title, window.location.href);
    hw.loadedContent[window.location.href] = hw.$('hw-content').innerHTML;
    hw.addedFirstUrlToHistory = true;
  }
  hw.startUrl = null; // XXX chrome, ugh, see below in popstate

  history.pushState({ 'title': title }, title, url);
  document.title = title;

  hw.swapContent(url);
};

hw.albumClick = function(event, el) {
  if (hw.hasClass('hw-content', 'hw-owner-viewing')) {
    if (hw.editContent(event, el)) {
      return; // we're going to edit
    }
  }

  if (hw.testAccelKey(event)) {
    return;
  }

  if (!hw.supportsHistory()) {
    return;
  }

  if (el.parentNode.getAttribute('data-is-album') == 'true' || el.parentNode.getAttribute('data-disallow-magic')) {
    return;
  }

  hw.preventDefault(event);  // stop regular links from continuing
  hw.navigate(event, el.getAttribute('href'), el.getAttribute('title'));
};

hw.swapContent = function(url, event) {
  var onSuccess = function(xhr, preloadedContent) {
    hw.addClass(hw.$('hw-content'), 'hw-invisible');
    var fn = function() {
      hw.$('hw-content').innerHTML = preloadedContent || (xhr ? xhr.responseText : '');
      hw.loadedContent[url] = preloadedContent || (xhr ? xhr.responseText : '');
      hw.removeClass(hw.$('hw-content'), 'hw-invisible');
      hw.preloadNextLogicalContent();

      hw.commentUploadButton();
    };
    setTimeout(fn, 100);
  };

  var onError = function() {
    window.location.href = url;
  };

  if (event && event.state['isAlbum']) {
    window.location.href = url;
  } else if (hw.loadedContent[url]) {
    onSuccess(null, hw.loadedContent[url]);
  } else {
    new hw.ajax(url,
          { method: 'get',
            onSuccess: onSuccess,
            onError: onError });
  }
};

hw.loadedContent = {};

hw.preloadNextLogicalContent = function() {
  if (!hw.$c('hw-neighbors')) {
    return;
  }

  var nextContent = hw.hasClass(hw.$c('hw-neighbors'), 'hw-reverse-sort') ? hw.$c('hw-next') : hw.$c('hw-previous');
  if (!hw.supportsHistory() || !nextContent || !nextContent.href || nextContent.getAttribute('data-disallow-magic')) {
    return;
  }

  var url = nextContent.href;

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

Event.observe(window, 'load', hw.preloadNextLogicalContent, false);
hw.startUrl = window.location.href;
hw.disableHistory = false;
Event.observe(window, 'popstate', function(e) {
  if (hw.disableHistory) {
    return;
  }

  if (hw.startUrl == window.location.href) { // XXX chrome sends a popstate event onload too
    hw.startUrl = null;
    return;
  }

  hw.swapContent(window.location.href, e);
  if (e.state) {
    document.title = e.state['title'];
  }
}, false);

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

  onScroll : function(opt_callback) {
    var currentOffset = this.offset;

    if (hw.supportsHistory()) {
      while (hw.$('hw-feed-page-' + (this.offset + 1)) && hw.$('hw-feed-page-' + (this.offset + 1)).getBoundingClientRect().top < 0) {
        ++this.offset;
      }
      while (hw.$('hw-feed-page-' + this.offset) && hw.$('hw-feed-page-' + this.offset).getBoundingClientRect().top >= 0) {
        --this.offset;
      }

      var parameterStart = this.url.indexOf('?');
      var pageUrl = this.url.substring(0, parameterStart == -1 ? this.url.length : parameterStart)
                 + (this.offset == 1 ? '' : '/page/' + this.offset);
                 //+ this.url.substring(parameterStart == -1 ? this.url.length : parameterStart, this.url.length);

      if (currentOffset != this.offset && this.offset != 0) {
        history.replaceState({ 'title': document.title }, document.title, pageUrl);
      }
    }

    var self = this;
    var nextOffset = this.offset + 1;
    var insertData = function(xhr) {
      self.offset = nextOffset;

      var fn = function() {
        self.processing = false;
      };
      setTimeout(fn, 3000);

      hw.$('hw-loading').parentNode.removeChild(hw.$('hw-loading'));
      self.feed.innerHTML += '<a id="hw-feed-page-' + nextOffset + '"></a>' + xhr.responseText;
      var a = document.body.offsetWidth;  // XXX workaround https://bugzilla.mozilla.org/show_bug.cgi?id=693219#c33

      if (opt_callback) {
        opt_callback();
      }

      //if (hw.supportsHistory()) {
      //  var url = self.url + '/page/' + (self.offset);
      //  history.replaceState({ 'title': document.title }, document.title, url);
      //}
    };

    var badTrip = function(xhr) {
      hw.$('hw-loading').parentNode.removeChild(hw.$('hw-loading'));

      if (xhr.status = 404) {
        self.done = true;
        self.processing = false;
      } else {
        var fn = function() {
          self.processing = false;
        };
        setTimeout(fn, 3000);
      }
    };

    if (!this.done && !this.processing && this.offset != 0 &&
        (document.height || document.body.parentNode.scrollHeight) -
        (document.body.parentNode.scrollTop || document.body.scrollTop) < (document.body.parentNode.clientHeight || document.body.clientHeight) * 3) {
      this.processing = true;
      this.feed.innerHTML += '<div id="hw-loading">' + hw.getMsg('loading') + '</div>';
      var a = document.body.offsetWidth;  // XXX workaround https://bugzilla.mozilla.org/show_bug.cgi?id=693219#c33 

      var parameterStart = this.url.indexOf('?');
      var nextPageUrl = this.url.substring(0, parameterStart == -1 ? this.url.length : parameterStart)
                      + '/page/' + (this.offset + 1)
                      + this.url.substring(parameterStart == -1 ? this.url.length : parameterStart, this.url.length);

      new hw.ajax(nextPageUrl,
        { method: 'get',
          onSuccess: insertData,
          onError: badTrip });
    }
  }
};
