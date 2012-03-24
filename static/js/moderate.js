hw.cursorCoords = function() {
  var wysiwyg = hw.$c('hw-wysiwyg');
  wysiwyg.focus();

  var sel = window.getSelection();
  sel.modify("extend", "backward", "character");
  var range = sel.getRangeAt(0);
  sel.modify("move", "forward", "character");

  return range.getBoundingClientRect();
};

hw.getLatestTypedUser = function() {
  var results = [];
  var monkeyIndex = hw.wysiwygLastKeys.lastIndexOf('@');
  // yes, they call it 'monkey' in some countries. cute, eh?
  if (monkeyIndex == -1) {
    return results;
  }

  var charsBack = hw.wysiwygLastKeys.length - monkeyIndex;
  var name = hw.wysiwygLastKeys.substring(monkeyIndex + 1);

  for (var x = 0; x < hw.remoteUsers.length; ++x) {
    if (!hw.remoteUsers[x]['username'] || !hw.remoteUsers[x]['profile_url']) {
      continue;
    }
    if (hw.remoteUsers[x]['username'].toLowerCase().indexOf(name.toLowerCase()) == 0) {
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
    var charsBack = hw.wysiwygLastKeys.length - monkeyIndex;
    var sel = window.getSelection();

    for (var x = 0; x < charsBack; ++x) {
      sel.modify("extend", "backward", "character");
    }

    hw.wysiwygLastKeys = "";
    document.execCommand("insertHTML", false, '<a href="' + user['profile_url'] + '">@' + user['username'] + '</a>&nbsp;');
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
      return [];
    }

    // When there is only one completion, use it directly.
    if (completions.length == 1) {
      insert(completions[0]);
      close();
      setTimeout(function(){
        wysiwyg.focus();
      }, 0);
    }

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
    if (completions.length <= 10) {
      complete.style.width = (sel.clientWidth - 1) + "px";
    }
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

    if (code == 13) { // Enter
      hw.preventDefault(event);
      pick();
    } else if (code == 27 || code == 32) {  // Escape, Space
      wysiwyg.focus();
      if (code == 27) {
        hw.preventDefault(event);
      }
      close();
    } else if (code != 38 && code != 40) {
      wysiwyg.focus();
      setTimeout(function() {
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

hw.readCurrent = null;
hw.read = function(event, el, listMode, readSpam) {
  if (event) {
    hw.preventDefault(event);
  }

  var user = '';
  var ownFeed = false;
  var url;

  hw.removeClass(hw.readCurrent || hw.$('hw-following-read-all'), 'hw-selected');

  if (listMode == undefined) {
    if (el) {
      user = el.parentNode.getAttribute('data-user');
      hw.readCurrent = el.parentNode;
      hw.addClass(el.parentNode, 'hw-selected');
    } else {
      ownFeed = true;
      hw.readCurrent = hw.$('hw-following-your-feed');
      hw.addClass(hw.$('hw-following-your-feed'), 'hw-selected');
    }

    if (readSpam) {
      url = hw.baseUri() + 'dashboard' + '?read_spam=1';
      hw.readCurrent = hw.$('hw-following-spam');
      hw.addClass(hw.$('hw-following-spam'), 'hw-selected');
    } else {
      url = hw.baseUri() + 'dashboard' + '?specific_feed=' + encodeURIComponent(user)
                                       + '&own_feed=' + (ownFeed ? 1 : 0)
                                       + '&list_mode=' + (hw.hasClass('hw-feed', 'hw-list-mode') ? 1 : 0);
    }
  } else {
    url = hw.loadMoreObject.url;  // TODO this isn't the cleanest way of doing this i know...
    url = url.replace('&list_mode=1', '').replace('&list_mode=0', '');
    url += (url.indexOf('?') == -1 ? '?' : '&') + 'list_mode=' + (listMode ? 1 : 0);
    hw.setClass('hw-feed', 'hw-list-mode', listMode);
    hw.setClass('hw-absorb-complete', 'hw-selected', !listMode);
    hw.setClass('hw-absorb-list', 'hw-selected', listMode);
    hw.setCookie('list_mode', listMode ? '1' : '0', -1, hw.basePath());
  }

  var callback = function(xhr) {
    hw.loadMoreObject.done = false;
    hw.loadMoreObject.offset = 1;
    if (user || ownFeed || listMode != undefined) {
      hw.loadMoreObject.url = url;
    } else if (!user) {
      hw.loadMoreObject.url = hw.baseUri() + 'dashboard';
    }
    hw.$('hw-feed').innerHTML = '<a id="hw-feed-page-1"></a>' + xhr.responseText;
  };

  var badTrip = function(xhr) {
    hw.$('hw-feed').innerHTML = el.parentNode.parentNode.getAttribute('data-error');
  };

  var createForm = hw.$c('hw-create');
  new hw.ajax(url,
    { method: 'get',
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.unfollow = function(event, el) {
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
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='       + encodeURIComponent('unfollow')
             + '&user='     + encodeURIComponent(user),
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.favorite = function(event, el) {
  if (event) {
    hw.preventDefault(event);
  }

  var user = el.parentNode.getAttribute('data-user');
  var localId = el.parentNode.getAttribute('data-local-id');
  var postId = el.parentNode.getAttribute('data-post-id');
  var isFavorited = el.parentNode.getAttribute('data-is-favorited');
  var isRemote = el.parentNode.getAttribute('data-is-remote');

  var callback = function(xhr) {
    el.innerHTML = isFavorited == '1' ? el.parentNode.getAttribute('data-favorite') : el.parentNode.getAttribute('data-unfavorite');
    el.parentNode.setAttribute('data-is-favorited', isFavorited == '1' ? '0' : '1');
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
};

hw.reply = function(event, el) {
  if (event) {
    hw.preventDefault(event);
  }

  var username = el.parentNode.getAttribute('data-username');
  var user = el.parentNode.getAttribute('data-user');
  var commentForm = hw.$c('hw-comment-form');

  if (commentForm) {
    if (document.body.parentNode.scrollTop) {
      document.body.parentNode.scrollTop = commentForm.getBoundingClientRect().top - 100;
    } else {
      document.body.scrollTop = commentForm.getBoundingClientRect().top - 100;
    }

    var input = hw.$c('hw-comment-input');
    var str = '@' + username + (input.value ? ' ' : '') + input.value + ' ';
    input.value = str;
    if (el.parentNode.parentNode.hasAttribute('data-post-id')) {  // we go to <li> element
      input.setAttribute('data-thread', el.parentNode.parentNode.getAttribute('data-post-id'));
      input.setAttribute('data-thread-user', el.parentNode.parentNode.getAttribute('data-post-user'));
    }
    input.focus();
    if (input.setSelectionRange) {
      input.setSelectionRange(input.value.length, input.value.length);
    } else {
      input.value = input.value;
    }

    return;
  }

  if (document.body.parentNode.scrollTop) {
    document.body.parentNode.scrollTop = hw.$c('hw-wysiwyg').getBoundingClientRect().top - 100;
  } else {
    document.body.scrollTop = hw.$c('hw-wysiwyg').getBoundingClientRect().top - 100;
  }

  var wysiwyg = hw.$c('hw-wysiwyg');
  wysiwyg.innerHTML = '<a href="' + user + '">@' + username + '</a>';
  wysiwyg.focus();

  if (document.createRange) {
    var range = document.createRange();
    range.selectNodeContents(wysiwyg);
    range.collapse(false);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (document.selection) {
    var range = document.body.createTextRange();
    range.moveToElementText(wysiwyg);
    range.collapse(false);
    range.select();
  }

  hw.$c('hw-thread').value = el.parentNode.getAttribute('data-post-id');
};

hw.spam = function(event, el) {
  if (event) {
    hw.preventDefault(event);
  }

  var user = el.parentNode.getAttribute('data-user');
  var localId = el.parentNode.getAttribute('data-local-id');
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
  var localId = el.parentNode.getAttribute('data-local-id');
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
hw.markSectionAsRead = function(section) {
  if (hw.hasClass(section, 'hw-leave-unread') || section.getAttribute('data-unread') == 'false') {
    return;
  }

  // section is above the fold, mark as read
  hw.markedAsRead.push(section.getAttribute('data-remote-id'));
  section.setAttribute('data-unread', 'false');
  hw.$('hw-total-unread-count').innerHTML = '(' + (parseInt(hw.$('hw-total-unread-count').innerHTML.slice(1, -1)) - 1) + ')';
  var countEl = hw.$$('#hw-following li[data-user="' + section.getAttribute('data-remote-profile-url') + '"] .hw-unread-count')[0];
  if (countEl) {
    countEl.innerHTML = '(' + (parseInt(countEl.innerHTML.slice(1, -1)) - 1) + ')';
  }
};
hw.markReadOnScroll = function(event) {
  var sections = document.getElementsByTagName('SECTION');

  for (var x = 0; x < sections.length; ++x) {
    if (sections[x].getAttribute('data-remote-id') && sections[x].getAttribute('data-unread') == 'true') {
      // TODO shouldn't really be dependant on thumbnailDelayLoad...
      // get the position of the 'fold' line from the parameter or manually
      windowPositionY = hw.thumbnailDelayLoad.getWindowScrollY() + 20;  //hw.thumbnailDelayLoad.getWindowSizeY();

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
  hw.$('hw-total-unread-count').innerHTML = '(' + (parseInt(hw.$('hw-total-unread-count').innerHTML.slice(1, -1)) + 1) + ')';
  var countEl = hw.$$('#hw-following li[data-user="' + section.getAttribute('data-remote-profile-url') + '"] .hw-unread-count')[0];
  if (countEl) {
    countEl.innerHTML = '(' + (parseInt(countEl.innerHTML.slice(1, -1)) + 1) + ')';
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
  var countEl = hw.$$('#hw-following li[data-user="' + user + '"] .hw-unread-count')[0];
  var count = parseInt(countEl.innerHTML.slice(1, -1));
  hw.$('hw-total-unread-count').innerHTML = '(' + (parseInt(hw.$('hw-total-unread-count').innerHTML.slice(1, -1)) - count) + ')';
  countEl.innerHTML = '(0)';

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
    hw.markSectionAsRead(newSection);
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
