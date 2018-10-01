hw.login = function(event, el) {
  hw.preventDefault(event);

  var login = el || hw.$('hw-login');

  var badTrip = function() {
    login.innerHTML = login.getAttribute('data-failed');
  };

  login.innerHTML = login.getAttribute('data-logging-in');

  // TODO would need to move this client id/domain to a config file
  var lock = new Auth0Lock('wQOPNew6usKJQ9fXqAMqxSENncVLDRLf', 'mimecuvalo.auth0.com', {
    auth: {
      redirectUrl: hw.baseUri() + 'login',
      responseType: 'code',
      params: {
        scope: 'openid email' // Learn about scopes: https://auth0.com/docs/scopes
      }
    }
  });
  lock.show();
};

hw.keyNavigation = function(event) {
  if (document.activeElement &&
      document.activeElement.hasAttribute('contenteditable')) {
    return;
  }

  var key = event.which ? event.which : event.keyCode;

  if (event.target && (event.target.nodeName == 'TEXTAREA' ||
      event.target.nodeName == 'INPUT')) {
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

  if ((key == Event.KEY_RIGHT && !reverse) ||
      (key == Event.KEY_LEFT && reverse)) {
    if (prev && prev.href) {
      if (prev.getAttribute('data-disallow-magic') || !hw.supportsHistory()) {
        window.location.href = prev.href;
      } else {
        hw.navigate(null, prev.href, prev.title);
      }
    }
  } else if ((key == Event.KEY_LEFT && !reverse) ||
      (key == Event.KEY_RIGHT && reverse)) {
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
hw.fullscreenLatestUrl = null;
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
    if (!hw.isFullscreen()) {
      history.replaceState({ 'title': title, 'isAlbum': isAlbum }, title,
          window.location.href);
    }
    hw.loadedContent[window.location.href] = hw.$('hw-content').innerHTML;
    hw.addedFirstUrlToHistory = true;
  }
  hw.startUrl = null; // XXX chrome, ugh, see below in popstate

  if (hw.isFullscreen()) {
    hw.fullscreenLatestUrl = { 'title': title, 'url': url };
  } else {
    history.pushState({ 'title': title }, title, url);
    document.title = title;
  }

  hw.swapContent(url);
};

hw.fullscreen = function(event) {
  hw.preventDefault(event);

  var content = hw.$('hw-container');
  content.requestFullScreen && content.requestFullScreen();
  content.mozRequestFullScreen && content.mozRequestFullScreen();
  content.webkitRequestFullScreen && content.webkitRequestFullScreen();
};

hw.isFullscreen = function() {
  return document.fullScreen || document.mozFullScreen
      || document.webkitIsFullScreen;
};

hw.fullscreenChange = function() {
  if (!hw.isFullscreen()) {
    if (hw.fullscreenLatestUrl) {
      history.pushState({ 'title': hw.fullscreenLatestUrl.title },
          hw.fullscreenLatestUrl.title, hw.fullscreenLatestUrl.url);
      document.title = hw.fullscreenLatestUrl.title;
      hw.fullscreenLatestUrl = null;
    }
  }
};
Event.observe(window, 'fullscreenchange', hw.fullscreenChange, false);
Event.observe(window, 'mozfullscreenchange', hw.fullscreenChange, false);
Event.observe(window, 'webkitfullscreenchange', hw.fullscreenChange, false);

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

  if (el.parentNode.getAttribute('data-is-album') == 'true' ||
      el.parentNode.getAttribute('data-disallow-magic')) {
    return;
  }

  hw.preventDefault(event);  // stop regular links from continuing
  hw.navigate(event, el.getAttribute('href'), el.getAttribute('title'));
};

hw.swapContent = function(url, event) {
  var onSuccess = function(xhr, preloadedContent) {
    hw.addClass(hw.$('hw-content'), 'hw-invisible');
    var fn = function() {
      hw.$('hw-content').innerHTML = preloadedContent ||
          (xhr ? xhr.responseText : '');
      hw.loadedContent[url] = preloadedContent || (xhr ? xhr.responseText : '');
      hw.removeClass(hw.$('hw-content'), 'hw-invisible');
      hw.preloadNextLogicalContent();

      hw.commentUploadButton();

      hw.loadHigherResIfPossible();
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

  var nextContent = hw.hasClass(hw.$c('hw-neighbors'), 'hw-reverse-sort') ?
      hw.$c('hw-next') : hw.$c('hw-previous');
  if (!hw.supportsHistory() || !nextContent || !nextContent.href ||
      nextContent.getAttribute('data-disallow-magic')) {
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

  if (hw.startUrl == window.location.href) {
    // XXX chrome sends a popstate event onload too
    hw.startUrl = null;
    return;
  }

  hw.swapContent(window.location.href, e);
  if (e.state) {
    document.title = e.state['title'];
  }
}, false);

hw.appendHTML = function(el, html) {
  // doing innerHTML += to the feed reloads
  var docFragment = document.createDocumentFragment();
  var div = document.createElement('div');
  div.innerHTML = html;
  docFragment.appendChild(div);
  el.insertBefore(docFragment, el.lastChild);
};

hw.loadMore = function(url, offset, opt_feed_id, opt_reverse) {
  this.url = url;
  this.url = this.url.lastIndexOf('/') == this.url.length - 1 ?
        this.url.substring(0, this.url.length - 1) : this.url;  // remove slash
  this.startedWithoutPage = this.url.indexOf('/page/') == -1;
  this.url = this.url.replace(/\/page\/\d+/g, '');
  this.initialOffset = offset;
  this.offset = offset;
  this.offsetModifier = opt_reverse ? -1 : 1;
  this.feed = opt_feed_id ? hw.$(opt_feed_id) : hw.$('hw-content');
};
hw.loadMore.prototype = {
  processing : false,
  done : false,

  onScroll : function(opt_callback, opt_force) {
    var currentOffset = this.offset;

    if (hw.supportsHistory()) {
      while (hw.$('hw-feed-page-' + (this.offset + this.offsetModifier)) &&
          hw.$('hw-feed-page-' + (this.offset + this.offsetModifier)).
          getBoundingClientRect().top < 0) {
        this.offset += this.offsetModifier;
      }
      while (hw.$('hw-feed-page-' + this.offset) &&
          hw.$('hw-feed-page-' + this.offset).
          getBoundingClientRect().top >= 0) {
        this.offset -= this.offsetModifier;
      }

      var parameterStart = this.url.indexOf('?');
      var pageUrl = this.url.substring(0, parameterStart == -1 ?
          this.url.length : parameterStart)
          + (this.startedWithoutPage && this.offset == this.initialOffset ? ''
          : '/page/' + this.offset);
          //+ this.url.substring(parameterStart == -1 ?
          //this.url.length : parameterStart, this.url.length);

      if (currentOffset != this.offset && this.offset !=
          (this.initialOffset - this.offsetModifier)) {
        history.replaceState({ 'title': document.title },
            document.title, pageUrl);
      }
    }

    var self = this;
    var nextOffset = this.offset + this.offsetModifier;
    var insertData = function(xhr) {
      self.offset = nextOffset;

      var fn = function() {
        self.processing = false;
      };
      setTimeout(fn, 3000);

      hw.$('hw-loading').parentNode.removeChild(hw.$('hw-loading'));
      hw.appendHTML(self.feed, '<a id="hw-feed-page-' + nextOffset + '"></a>' +
          xhr.responseText);
      var a = document.body.offsetWidth;
      // XXX workaround https://bugzilla.mozilla.org/show_bug.cgi?id=693219#c33

      if (opt_callback) {
        opt_callback();
      }

      //if (hw.supportsHistory()) {
      // var url = self.url + '/page/' + (self.offset);
      // history.replaceState({ 'title': document.title }, document.title, url);
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

    if (!this.done && !this.processing &&
        ((this.offset != (this.initialOffset - this.offsetModifier) &&
        (document.height || document.body.parentNode.scrollHeight) -
        (document.body.parentNode.scrollTop || document.body.scrollTop) <
        (document.body.parentNode.clientHeight || document.body.clientHeight) *
        3
        && !hw.$('hw-feed-page-' + (this.offset + this.offsetModifier))) ||
            opt_force)) {
      this.processing = true;
      hw.appendHTML(this.feed, '<div id="hw-loading">' + hw.getMsg('loading') +
          '</div>');
      var a = document.body.offsetWidth;
      // XXX workaround https://bugzilla.mozilla.org/show_bug.cgi?id=693219#c33 

      var parameterStart = this.url.indexOf('?');
      var offsetToSend = opt_force ? (currentOffset + this.offsetModifier) :
          (this.offset + this.offsetModifier);
      var nextPageUrl = this.url.substring(0, parameterStart == -1 ?
          this.url.length : parameterStart)
          + '/page/' + offsetToSend
          + this.url.substring(parameterStart == -1 ?
          this.url.length : parameterStart, this.url.length);

      new hw.ajax(nextPageUrl,
        { method: 'get',
          onSuccess: insertData,
          onError: badTrip });
    }
  }
};


hw.loadHigherResIfPossible = function() {
    Array.prototype.slice.call(document.querySelectorAll('.hw-view img')).forEach(function(img) {
          if (img.parentNode.href.indexOf('/original/') != -1) {
            img.src = img.parentNode.href;
          }
    });
};
Event.observe(window, 'load', hw.loadHigherResIfPossible, false);

