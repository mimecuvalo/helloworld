hw.login = function(event, el) {
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
  var neighbors = hw.getFirstElementByName('hw-neighbors');
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

hw.albumClick = function(event, el) {
  if (hw.hasClass('hw-content', 'hw-owner-viewing')) {
    if (hw.editContent(event, el)) {
      return; // we're going to edit
    }
  }

  if (hw.testAccelKey(event)) {
    return;
  }

  if (el.parentNode.getAttribute('data-is-album') == 'false') {
    hw.preventDefault(event);  // stop regular links from continuing
    hw.navigate(event, el.getAttribute('href'), el.getAttribute('title'));
  }
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
