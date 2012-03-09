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

hw.read = function(event, el, listMode, readSpam) {
  if (event) {
    hw.preventDefault(event);
  }

  var user = '';
  var ownFeed = false;
  var url;

  if (listMode == undefined) {
    if (el) {
      user = el.parentNode.getAttribute('data-user');
    } else {
      ownFeed = true;
    }

    if (readSpam) {
      url = hw.baseUri() + 'dashboard' + '?read_spam=1';
    } else {
      url = hw.baseUri() + 'dashboard' + '?specific_feed=' + encodeURIComponent(user)
                                       + '&own_feed=' + (ownFeed ? 1 : 0)
                                       + '&list_mode=' + (hw.hasClass('hw-feed', 'hw-list-mode') ? 1 : 0);
    }
  } else {
    url = hw.loadMoreObject.url;  // this isn't the cleanest way of doing this i know...
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

  var user = el.parentNode.getAttribute('data-user');

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
  var str = '@' + username + (wysiwyg.innerHTML ? ' ' : '') + wysiwyg.innerHTML + ' ';
  wysiwyg.innerHTML = str;
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

hw.followingEdit = function(event) {
  if (event) {
    hw.preventDefault(event);
  }

  hw.setClass('hw-following', 'hw-edit-mode', !hw.hasClass('hw-following', 'hw-edit-mode'));
};
