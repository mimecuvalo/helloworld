hw.cursorCoords = function() {
  var wysiwyg = hw.$c('hw-wysiwyg');
  wysiwyg.focus();

  var sel = window.getSelection();
  hw.modify("extend", "backward", "character");
  var range = sel.getRangeAt(0);
  hw.modify("move", "forward", "character");

  return range.getBoundingClientRect();
};

hw.getLatestTypedUser = function() {
  var results = [];
  var monkeyIndex = hw.wysiwygLastKeys.lastIndexOf('@');
  // yes, they call it 'monkey' in some countries. cute, eh?
  if (monkeyIndex == -1) {
    monkeyIndex = hw.wysiwygLastKeys.lastIndexOf('+');
    if (monkeyIndex == -1) {
      return results;
    }
  }

  var name = hw.wysiwygLastKeys.substring(monkeyIndex + 1);

  for (var x = 0; x < hw.remoteUsers.length; ++x) {
    if (!hw.remoteUsers[x]['username'] || !hw.remoteUsers[x]['profile_url']) {
      continue;
    }
    if (hw.remoteUsers[x]['username'].toLowerCase().indexOf(name.toLowerCase()) == 0
        && name.length <= hw.remoteUsers[x]['username'].length) {
      results.push(hw.remoteUsers[x]);
    }
  }

  return results;
};

// borrowed from codemirror's simplehint
// http://codemirror.net/lib/util/simple-hint.js
hw.showUserAutocomplete = function() {
  var wysiwyg = hw.$c('hw-wysiwyg');

  function insert(user) {
    wysiwyg.focus();

    var monkeyIndex = hw.wysiwygLastKeys.lastIndexOf('@');
    var usingPlus = false;
    if (monkeyIndex == -1) {
      monkeyIndex = hw.wysiwygLastKeys.lastIndexOf('+');
      usingPlus = true;
    }
    var charsBack = hw.wysiwygLastKeys.length - monkeyIndex;
    var sel = window.getSelection();

    for (var x = 0; x < charsBack; ++x) {
      hw.modify("extend", "backward", "character");
    }

    hw.wysiwygLastKeys = "";
    hw.insertHTML('<a href="' + user['profile_url'] + '">' + (usingPlus ? '+' : '@') + user['username'] + '</a>&nbsp;');
    hw.saveSelection();
  }

  // Build the select widget
  var complete = document.createElement("div");
  complete.className = "hw-completions";
  var sel = complete.appendChild(document.createElement("select"));

  // Opera doesn't move the selection when pressing up/down in a
  // multi-select, but it does properly support the size property on
  // single-selects, so no multi-select is necessary.
  if (!window.opera) {
    sel.multiple = true;
  }

  function updateChoices() {
    var completions = hw.getLatestTypedUser();
    if (!completions.length) {
      complete.style.opacity = '0';
      return;
    }
    complete.style.opacity = '1';

    // When there is only one completion, use it directly.
    /*if (completions.length == 1) {
      insert(completions[0]);
      close();
      setTimeout(function(){
        wysiwyg.focus();
      }, 0);
    }*/

    while (sel.firstChild) {
      sel.removeChild(sel.firstChild);
    }

    for (var x = 0; x < completions.length; ++x) {
      var opt = sel.appendChild(document.createElement("option"));
      opt.appendChild(document.createTextNode(completions[x]['username']));
      opt.setAttribute('data-profile-url', completions[x]['profile_url']);
    }

    sel.firstChild.selected = true;
    sel.size = Math.min(10, completions.length);

    // Hack to hide the scrollbar.
    /*if (completions.length <= 10) {
      complete.style.width = (sel.clientWidth - 1) + "px";
    }*/
  }

  updateChoices();

  var pos = hw.cursorCoords();

  complete.style.left = pos.left + "px";
  var docRect = document.body.getBoundingClientRect();
  complete.style.top = (Math.abs(docRect.top) + pos.top + 20) + "px";
  document.body.appendChild(complete);

  // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
  var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
  if (winW - pos.top < sel.clientWidth) {
    complete.style.left = (pos.top - sel.clientWidth) + "px";
  }

  function closeAutocompletion(event) {
    var el = event.target;
    var ancestor = complete;
    while (el != null) {
      if (el == ancestor) {
        return;
      }
      el = el.parentNode;
    }

    close();
  }

  var done = false;
  function close() {
    if (done) {
      return;
    }

    done = true;
    hw.wysiwygLastKeys = "";
    Event.stopObserving(document, 'click', closeAutocompletion, false);
    complete.parentNode.removeChild(complete);
  }

  function pick() {
    var completions = hw.getLatestTypedUser();
    insert(completions[sel.selectedIndex]);
    close();
    setTimeout(function(){
      wysiwyg.focus();
    }, 0);
  }

  Event.observe(sel, 'keydown', function(event) {
    var code = event.which || event.keyCode;

    var completions = hw.getLatestTypedUser();
    var monkeyIndex = hw.wysiwygLastKeys.lastIndexOf('@');
    if (monkeyIndex == -1) {
      monkeyIndex = hw.wysiwygLastKeys.lastIndexOf('+');
    }
    var name = "";
    if (monkeyIndex != -1) {
      name = hw.wysiwygLastKeys.substring(monkeyIndex + 1);
    }

    // XXX todo, why won't this prevent default for tab in Firefox??
    if (code == 13 || code == 9 || (code == 32 && completions.length && name == completions[0]['username'])) { // Enter, Space, Tab
      hw.preventDefault(event);
      pick();
    } else if (code == 27 || code == 32 || code == 50 || monkeyIndex == -1) {  // Escape, Space, @
      wysiwyg.focus();
      if (code == 27) {
        hw.preventDefault(event);
      }
      close();
    } else if (code != 38 && code != 40) {  // not up and not down
      var currentLastKeys = hw.wysiwygLastKeys;
      wysiwyg.focus();
      setTimeout(function() {
        if (code == 8 && currentLastKeys == hw.wysiwygLastKeys) {  // hmm, backspace doesn't pass through for some reason in chrome...
          hw.wysiwygKeys(event);
        }
        hw.saveSelection();
        sel.focus();
        updateChoices();
      }, 0);
    }
  }, false);
  Event.observe(sel, 'dblclick', pick, false);
  Event.observe(document, 'click', closeAutocompletion, false);

  setTimeout(function(){
    if (!done) {
      hw.saveSelection();
      sel.focus();
    }
  }, 0);
};

hw.follow = function(event, el) {
  if (event) {
    hw.preventDefault(event);
  }

  var user = hw.$('hw-following-new').value;

  if (!user) {
    return;
  }

  var button = hw.$('hw-following-button');
  button.innerHTML = button.getAttribute('data-following');
  button.disabled = true;

  var callback = function(xhr) {
    hw.$('hw-following-new').value = '';
    button.disabled = false;
    window.location.reload();
  };

  var badTrip = function(xhr) {
    button.disabled = false;
    button.innerHTML = button.getAttribute('data-normal');
    alert(hw.$('hw-following-new').getAttribute('data-error'));
  };

  var createForm = hw.$c('hw-create');
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='       + encodeURIComponent('follow')
             + '&user='     + encodeURIComponent(user),
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.followViaFollower = function(event, el) {
  hw.$('hw-following-new').value = el.getAttribute('data-user');
  hw.follow(event);
}

hw.readCurrent = null;
hw.read = function(event, el, listMode, special, query, readAllMode) {
  if (event) {
    hw.preventDefault(event);
  }

  var user = '';
  var ownFeed = false;
  var url;

  hw.removeClass(hw.readCurrent || hw.$('hw-following-read-all'), 'hw-selected');

  if (query) {
    url = hw.loadMoreObject.url;
    var args = hw.parseArguments(url);
    args['q'] = encodeURIComponent(query.value);
    url = url.split('?')[0] + hw.generateArgs(args);
  } else if (listMode == undefined && readAllMode == undefined) {
    var sortType = '';
    if (el) {
      user = el.parentNode.getAttribute('data-user');
      hw.readCurrent = el.parentNode;
      hw.addClass(el.parentNode, 'hw-selected');
      sortType = el.parentNode.getAttribute('data-sort-type');
    } else {
      ownFeed = true;
      hw.readCurrent = hw.$('hw-following-your-feed');
      hw.addClass(hw.$('hw-following-your-feed'), 'hw-selected');
    }

    if (special) {
      url = hw.baseUri() + 'dashboard' + '?read_' + special + '=1';
      hw.readCurrent = hw.$('hw-following-' + special);
      hw.addClass(hw.$('hw-following-' + special), 'hw-selected');
    } else {
      url = hw.baseUri() + 'dashboard' + '?specific_feed=' + encodeURIComponent(user)
                                       + '&own_feed=' + (ownFeed ? 1 : 0)
                                       + '&sort_type=' + (sortType == 'oldest' ? 'oldest' : '')
                                       + '&list_mode=' + (hw.hasClass('hw-feed', 'hw-list-mode') ? 1 : 0);
    }
  } else {
    url = hw.loadMoreObject.url;
    var args = hw.parseArguments(url);
    if (listMode != undefined) {
      args['list_mode'] = listMode ? 1 : 0;
      hw.setCookie('list_mode', listMode ? '1' : '0', -1, hw.basePath());
    }
    if (readAllMode != undefined) {
      args['read_all_mode'] = readAllMode ? 1 : 0;
      hw.setCookie('read_all_mode', readAllMode ? '1' : '0', -1, hw.basePath());
    }
    url = url.split('?')[0] + hw.generateArgs(args);
  }

  var callback = function(xhr, badTrip) {
    hw.loadMoreObject.done = badTrip ? true : false;
    hw.loadMoreObject.offset = 1;
    if (listMode != undefined) {
      hw.setClass('hw-feed', 'hw-list-mode', listMode);
    }
    if (user || ownFeed || listMode != undefined || readAllMode != undefined || special || query) {
      hw.loadMoreObject.url = url;
    } else if (!user) {
      hw.loadMoreObject.url = hw.baseUri() + 'dashboard';
    }

    if (!badTrip) {
      var fromLocalId = /data-local-id="([^"]*)"/.exec(xhr.responseText);
      var fromRemoteId = /data-remote-id="([^"]*)"/.exec(xhr.responseText);
      var args = hw.parseArguments(hw.loadMoreObject.url);
      if (fromLocalId && fromLocalId.length > 1) {
        args['from_local_id'] = fromLocalId[1];
      }
      if (fromRemoteId && fromRemoteId.length > 1) {
        args['from_remote_id'] = fromRemoteId[1];
      }
      hw.loadMoreObject.url = hw.loadMoreObject.url.split('?')[0] + hw.generateArgs(args);
    }

    if (hw.supportsHistory()) {
      history.replaceState({ 'title': document.title }, document.title, hw.baseUri() + 'dashboard');
    }

    if (document.body.parentNode.scrollTop) {
      document.body.parentNode.scrollTop = document.body.parentNode.scrollTop + hw.$('hw-feed').getBoundingClientRect().top - 50;
    } else {
      document.body.scrollTop = document.body.scrollTop + hw.$('hw-feed').getBoundingClientRect().top - 50;
    }

    if (badTrip) {
      hw.$('hw-feed').innerHTML = hw.$('hw-following-list').getAttribute('data-error');
    } else {
      hw.$('hw-feed').innerHTML = '<a id="hw-feed-page-1"></a>' + xhr.responseText;
    }
    hw.updateCounts();
  };

  var badTrip = function(xhr) {
    callback(null, true);
  };

  var createForm = hw.$c('hw-create');
  new hw.ajax(url,
    { method: 'get',
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.listMode = function(event, el) {
  hw.preventDefault(event);

  var isListMode = hw.hasClass(hw.menuOriginal, 'hw-list-mode');
  if (isListMode) {
    hw.removeClass(hw.menuOriginal, 'hw-list-mode');
    hw.addClass(hw.menuOriginal, 'hw-complete-mode');
  } else {
    hw.removeClass(hw.menuOriginal, 'hw-complete-mode');
    hw.addClass(hw.menuOriginal, 'hw-list-mode');
  }

  hw.read(event, null, (isListMode ? false : true));
};

hw.readAllMode = function(event, el) {
  hw.preventDefault(event);

  var isReadAllMode = hw.hasClass(hw.menuOriginal, 'hw-read-all-mode');
  if (isReadAllMode) {
    hw.removeClass(hw.menuOriginal, 'hw-read-all-mode');
    hw.addClass(hw.menuOriginal, 'hw-unread-mode');
  } else {
    hw.removeClass(hw.menuOriginal, 'hw-unread-mode');
    hw.addClass(hw.menuOriginal, 'hw-read-all-mode');
  }

  hw.read(event, null, null, null, null, (isReadAllMode ? false : true));
};

hw.sort = function(event, el) {
  hw.preventDefault(event);

  var newest = hw.hasClass(hw.menuOriginal, 'hw-sort-newest');
  if (newest) {
    hw.removeClass(hw.menuOriginal, 'hw-sort-newest');
    hw.addClass(hw.menuOriginal, 'hw-sort-oldest');
  } else {
    hw.removeClass(hw.menuOriginal, 'hw-sort-oldest');
    hw.addClass(hw.menuOriginal, 'hw-sort-newest');
  }

  hw.menuButton.parentNode.parentNode.setAttribute('data-sort-type', newest ? 'oldest' : '');
  hw.read(event, hw.menuButton.parentNode);
};

hw.updateCount = function(el, delta, opt_setCount) {
  if (!el) {
    return;
  }

  var newCount;
  if (opt_setCount != undefined) {
    newCount = opt_setCount;
  } else {
    newCount = parseInt(el.textContent.slice(2, -1)) + delta;
  }
  el.innerHTML = '&nbsp;(' + newCount + ')';
};

hw.updateCounts = function(opt_skipExternal) {
  var callback = function(xhr) {
    var json = JSON.parse(xhr.responseText);
    hw.updateCount(hw.$('hw-total-unread-count'), null, json['total_count']);
    hw.updateCount(hw.$$('#hw-following #hw-following-favorites .hw-unread-count')[0], null, json['favorites_count']);
    hw.updateCount(hw.$$('#hw-following #hw-following-comments .hw-unread-count')[0], null, json['comments_count']);
    hw.updateCount(hw.$$('#hw-following #hw-following-spam .hw-unread-count')[0], null, json['spam_count']);
    hw.updateCount(hw.$$('#hw-following #hw-following-twitter .hw-unread-count')[0], null, json['twitter_count']);
    hw.updateCount(hw.$$('#hw-following #hw-following-facebook .hw-unread-count')[0], null, json['facebook_count']);
    hw.updateCount(hw.$$('#hw-following #hw-following-google .hw-unread-count')[0], null, json['google_count']);
    hw.updateCount(hw.$$('#hw-following #hw-following-tumblr .hw-unread-count')[0], null, json['tumblr_count']);

    for (var user in json) {
      if (user.indexOf('http') == 0) {
        hw.updateCount(hw.$$('#hw-following li[data-user="' + user + '"] .hw-unread-count')[0], null, json[user]);
      }
    }
  };

  var createForm = hw.$c('hw-create');
  new hw.ajax(hw.baseUri() + 'dashboard?get_counts=1',
    { method: 'get',
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: function() {} });

  if (!opt_skipExternal) {
    hw.updateExternal();
  }
};

hw.unfollow = function(event, el, opt_special) {
  if (event) {
    hw.preventDefault(event);
  }

  if (!window.confirm(hw.getMsg('confirm-delete'))) {
    return;
  }

  var user = el.getAttribute('data-user');

  var callback = function(xhr) {
    window.location.reload();
  };

  var badTrip = function(xhr) {
    alert(hw.$('hw-following-new').getAttribute('data-error-unsub'));
  };

  var createForm = hw.$c('hw-create');

  if (user == 'twitter' || user == 'facebook' || user == 'google' || user == 'tumblr') {
    new hw.ajax(hw.baseUri() + user,
      { method: 'delete',
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: callback,
        onError: badTrip });
  } else {
    new hw.ajax(hw.baseUri() + 'api',
      { method: 'post',
        postBody: 'op='       + encodeURIComponent('unfollow')
               + '&user='     + encodeURIComponent(user),
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: callback,
        onError: badTrip });
  }
};

hw.favorite = function(event, el) {
  if (event) {
    hw.preventDefault(event);
  }

  var user = el.parentNode.getAttribute('data-user');
  var type = el.parentNode.getAttribute('data-type');
  var localId = el.parentNode.getAttribute('data-id');
  var postId = el.parentNode.getAttribute('data-post-id');
  var isFavorited = el.parentNode.getAttribute('data-is-favorited');
  var isRemote = el.parentNode.getAttribute('data-is-remote');

  var callback = function(xhr) {
    el.innerHTML = isFavorited == '1' ? el.parentNode.getAttribute('data-favorite') : el.parentNode.getAttribute('data-unfavorite');
    el.parentNode.setAttribute('data-is-favorited', isFavorited == '1' ? '0' : '1');
    hw.updateCount(hw.$$('#hw-following #hw-following-favorites .hw-unread-count')[0], isFavorited == '1' ? -1 : 1);
  };

  var badTrip = function(xhr) {
    el.innerHTML = el.parentNode.getAttribute('data-error');
  };

  var createForm = hw.$c('hw-create');
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='       + encodeURIComponent('favorite')
             + '&user='     + encodeURIComponent(user)
             + '&post_id='  + encodeURIComponent(postId)
             + '&local_id='  + encodeURIComponent(localId)
             + '&is_remote=' + encodeURIComponent(isRemote)
             + '&not_favorited='  + encodeURIComponent(isFavorited == '1' ? '1' : '0'),
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });

  if (type == 'twitter' || type == 'facebook' || type == 'google' || type == 'tumblr') {
    new hw.ajax(hw.baseUri() + type,
      { method: 'post',
        postBody: 'op='       + encodeURIComponent('favorite')
               + '&post_id='  + encodeURIComponent(postId)
               + '&not_favorited='  + encodeURIComponent(isFavorited == '1' ? '1' : '0'),
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: function() {},
        onError: function() {} });
  }
};

hw.spam = function(event, el) {
  if (event) {
    hw.preventDefault(event);
  }

  var user = el.parentNode.getAttribute('data-user');
  var localId = el.parentNode.getAttribute('data-id');
  var isSpam = el.parentNode.getAttribute('data-is-spam');
  var isRemote = el.parentNode.getAttribute('data-is-remote');

  var callback = function(xhr) {
    el.innerHTML = isSpam == '1' ? el.parentNode.getAttribute('data-spam') : el.parentNode.getAttribute('data-not-spam');
    el.parentNode.setAttribute('data-is-spam', isSpam == '1' ? '0' : '1');
  };

  var badTrip = function(xhr) {
    el.innerHTML = el.parentNode.getAttribute('data-error');
  };

  var createForm = hw.$c('hw-create');
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='       + encodeURIComponent('spam')
             + '&user='     + encodeURIComponent(user)
             + '&local_id='  + encodeURIComponent(localId)
             + '&is_remote='  + encodeURIComponent(isRemote)
             + '&not_spam='  + encodeURIComponent(isSpam == '1' ? '1' : '0'),
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.deletePost = function(event, el) {
  if (event) {
    hw.preventDefault(event);
  }

  var user = el.parentNode.getAttribute('data-user');
  var localId = el.parentNode.getAttribute('data-id');
  var isDeleted = el.parentNode.getAttribute('data-is-deleted');
  var isRemote = el.parentNode.getAttribute('data-is-remote');

  var callback = function(xhr) {
    el.innerHTML = isDeleted == '1' ? el.parentNode.getAttribute('data-delete') : el.parentNode.getAttribute('data-undelete');
    el.parentNode.setAttribute('data-is-deleted', isDeleted == '1' ? '0' : '1');
  };

  var badTrip = function(xhr) {
    el.innerHTML = el.parentNode.getAttribute('data-error');
  };

  var createForm = hw.$c('hw-create');
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='       + encodeURIComponent('delete')
             + '&user='     + encodeURIComponent(user)
             + '&local_id='  + encodeURIComponent(localId)
             + '&is_remote='  + encodeURIComponent(isRemote)
             + '&not_deleted='  + encodeURIComponent(isDeleted == '1' ? '1' : '0'),
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.markedAsRead = [];
hw.markedAsUnread = [];
hw.markSectionAsRead = function(section, opt_force) {
  var sections = hw.$('hw-feed').getElementsByTagName('SECTION');
  for (var x = 0; x < sections.length; ++x) {
    if (!opt_force && (hw.hasClass('hw-feed', 'hw-list-mode') || hw.hasClass(sections[x], 'hw-leave-unread') || sections[x].getAttribute('data-unread') == 'false')) {
      if (sections[x] == section) {
        break;
      } else {
        continue;
      }
    }

    var type = sections[x].getAttribute('data-type');
    var countEl;
    if (type == 'twitter' || type == 'facebook' || type == 'google' || type == 'tumblr') {
      countEl = hw.$$('#hw-following #hw-following-' + type + ' .hw-unread-count')[0];
    } else if (type == 'post') {
      countEl = hw.$$('#hw-following li[data-user="' + sections[x].getAttribute('data-remote-profile-url') + '"] .hw-unread-count')[0];
    } else {
      continue;
    }

    // section is above the fold, mark as read
    hw.markedAsRead.push(sections[x].getAttribute('data-remote-id'));
    sections[x].setAttribute('data-unread', 'false');
    hw.updateCount(hw.$('hw-total-unread-count'), -1);
    if (countEl) {
      hw.updateCount(countEl, -1);
    }

    if (sections[x] == section) {
      break;
    }
  }
};
hw.markReadOnScroll = function(event) {
  if (hw.hasClass('hw-feed', 'hw-list-mode')) {
    return;
  }

  var sections = document.getElementsByTagName('SECTION');
  var windowPositionY = hw.thumbnailDelayLoad.getWindowScrollY() + 20;  //hw.thumbnailDelayLoad.getWindowSizeY();

  for (var x = 0; x < sections.length; ++x) {
    if (sections[x].getAttribute('data-remote-id') && sections[x].getAttribute('data-unread') == 'true') {
      // TODO shouldn't really be dependant on thumbnailDelayLoad...
      // get the position of the 'fold' line from the parameter or manually
      if (hw.thumbnailDelayLoad.getPositionY(sections[x]) <= windowPositionY) {
        hw.markSectionAsRead(sections[x]);
      }
    }
  }
};
hw.markAsUnread = function(event, el) {
  hw.preventDefault(event);
  hw.stopPropagation(event);

  var section = el;
  while (section) {
    if (section.nodeName == 'SECTION') {
      break;
    }
    section = section.parentNode;
  }

  if (section.getAttribute('data-unread') == 'true') {
    if (hw.hasClass(section, 'hw-leave-unread')) {
      hw.removeClass(section, 'hw-leave-unread');
      hw.markSectionAsRead(section);
    } else {
      hw.addClass(section, 'hw-leave-unread');
    }
    return;
  }

  hw.addClass(section, 'hw-leave-unread');

  hw.markedAsUnread.push(section.getAttribute('data-remote-id'));
  section.setAttribute('data-unread', 'true');
  hw.updateCount(hw.$('hw-total-unread-count'), 1);

  var type = section.getAttribute('data-type');
  var countEl;
  if (type == 'twitter' || type == 'facebook' || type == 'google' || type == 'tumblr') {
    countEl = hw.$$('#hw-following #hw-following-' + type + ' .hw-unread-count')[0];
  } else if (type == 'post') {
    countEl = hw.$$('#hw-following li[data-user="' + section.getAttribute('data-remote-profile-url') + '"] .hw-unread-count')[0];
  } else {
    return;
  }

  if (countEl) {
    hw.updateCount(countEl, 1);
  }
};
hw.sendMarkedAsRead = function() {
  var createForm = hw.$c('hw-create');

  if (hw.markedAsRead.length) {
    new hw.ajax(hw.baseUri() + 'api',
      { method: 'post',
        postBody: 'op='   + encodeURIComponent('read')
               + '&ids='  + encodeURIComponent(JSON.stringify(hw.markedAsRead)),
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: function() {},
        onError: function() {} });
    hw.markedAsRead = [];
  }

  if (hw.markedAsUnread.length) {
    new hw.ajax(hw.baseUri() + 'api',
      { method: 'post',
        postBody: 'op='   + encodeURIComponent('unread')
               + '&ids='  + encodeURIComponent(JSON.stringify(hw.markedAsUnread)),
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: function() {},
        onError: function() {} });
    hw.markedAsUnread = [];
  }
};
hw.markAllAsRead = function(event, el) {
  hw.preventDefault(event);

  var user = el.getAttribute('data-user');
  var countEl;
  if (user == 'google' || user == 'facebook' || user == 'twitter' || user == 'tumblr') {
    countEl = hw.$$('#hw-following #hw-following-' + user + ' .hw-unread-count')[0];
  } else {
    countEl = hw.$$('#hw-following li[data-user="' + user + '"] .hw-unread-count')[0];
  }
  var count = parseInt(countEl.textContent.slice(2, -1));
  hw.updateCount(hw.$('hw-total-unread-count'), -1 * count);
  hw.updateCount(countEl, 0, 0);

  var createForm = hw.$c('hw-create');
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='   + encodeURIComponent('read_all')
             + '&user=' + encodeURIComponent(user),
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: function() {},
      onError: function() {} });
};

hw.listOpen = function(event, el) {
  if (hw.getCookie('list_mode', '0') == '0') {
    return;
  }

  hw.preventDefault(event);

  var local_entry = el.getAttribute('data-local-id');
  var remote_entry = el.getAttribute('data-remote-id');
  var entry = local_entry || remote_entry;
  var section = el;
  while (section) {
    if (section.nodeName == 'SECTION') {
      break;
    }
    section = section.parentNode;
  }

  if (hw.hasClass(section, 'hw-list-open')) {
    hw.removeClass(section, 'hw-list-open');
    hw.addClass(section, 'hw-list-closed');
    return;
  } else if (hw.hasClass(section, 'hw-list-closed')) {
    hw.removeClass(section, 'hw-list-closed');
    hw.addClass(section, 'hw-list-open');
    return;
  }

  var callback = function(xhr) {
    var div = document.createElement('DIV');
    div.innerHTML = xhr.responseText;
    section.parentNode.replaceChild(div, section);
    var newSection = div.getElementsByTagName('SECTION')[0];
    hw.addClass(newSection, 'hw-list-open');
    hw.markSectionAsRead(newSection, true);
  };

  var badTrip = function() {
    hw.displayResponse(false, hw.getMsg('error'));
  };

  var url = hw.baseUri() + 'dashboard?' + (local_entry ? 'local' : 'remote') + '_entry='  + encodeURIComponent(entry)
                                        + '&list_mode=0';

  var createForm = hw.$c('hw-create');
  new hw.ajax(url,
    { method: 'get',
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.outgoingLink = function(event) {
  var link = event.target;
  if (link.nodeName != 'A') {
    return;
  }

  var el = link;
  while (el != null) {
    if (hw.hasClass(el, 'hw-view')) {
      hw.preventDefault(event);
      window.open(link.href, '_blank');
      return;
    }
    el = el.parentNode;
  }
};

hw.updateExternal = function() {
  var externalSources = ['twitter', 'facebook', 'google', 'tumblr'];
  for (var x = 0; x < externalSources.length; ++x) {
    if (hw.$('hw-following-' + externalSources[x]).hasAttribute('data-enabled')) {
      new hw.ajax(hw.baseUri() + externalSources[x] + '?get_feed=1',
        { method: 'get',
          onSuccess: hw.updateExternalHelper(externalSources[x]),
          onError: function() { } });
    }
  }
};

hw.updateExternalHelper = function(service) {
  return function(xhr) {
    var json = JSON.parse(xhr.responseText);
    hw.updateCounts(true);
  }
};
