hw.displayResponse = function(good, msg) {
  var response = hw.$c('hw-response');
  hw.removeClass(response, 'hw-hidden');
  hw.setClass(response, 'hw-bad', !good);
  response.innerHTML = msg;
  var callback = function() {
    hw.addClass(response, 'hw-hidden');
  };
  setTimeout(callback, 3000);
};

hw.changeBeforeUnloadState = function(event, allowPageChange) {
  if (hw.$('hw-container') && !hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  var createForm = hw.$c('hw-create');
  var wysiwyg = hw.$c('hw-wysiwyg');
  var noChange = wysiwyg.textContent.replace('\n', '') == hw.getMsg('untitled') || wysiwyg.textContent == '';
  noChange = noChange && !createForm['hw-code'].value && !createForm['hw-style'].value;
  noChange = noChange && wysiwyg.innerHTML.search(/<(?!\/?(h1|br))/ig) == -1;
  allowPageChange = allowPageChange || noChange;

  window.onbeforeunload = allowPageChange ? null : function() { return "" };

  var createForm = hw.$c('hw-create');
  var title = "";
  if (!createForm['hw-id'].value) {
    var newTitle = hw.$('hw-new-title');
    title = newTitle && newTitle.textContent != hw.getMsg('untitled') ? newTitle.textContent : '(' + hw.getMsg('untitled') + ')';
  } else {
    title = createForm['hw-title'].value || '(' + hw.getMsg('untitled') + ')';
  }
  document.title = hw.contentOwnerTitle.replace(/&quot;/g, '"')
                + (hw.contentOwnerTitle && title ? ' - ' : '')
                + title.replace(/&quot;/g, '"')
                + (allowPageChange ? '' : ' +');
};

hw.resetSaveState = function() {
  var createForm = hw.$c('hw-create');
  var response = hw.$c('hw-response');

  hw.displayResponse(true, response.getAttribute('data-saved'));
  createForm['hw-save'].value = createForm['hw-save'].getAttribute('data-save');
  createForm['hw-save'].disabled = false;

  hw.changeBeforeUnloadState(null, true);
};

hw.resetCreateForm = function() {
  var createForm = hw.$c('hw-create');

  createForm['hw-title'].value = '';
  createForm['hw-price'].value = '0.00';
  createForm['hw-thread'].value = '';
  createForm['hw-date-start'].value = '';
  createForm['hw-date-end'].value = '';
  createForm['hw-date-repeats'].value = '';
  hw.$c('hw-wysiwyg').innerHTML = '<h1 id="hw-new-title">' + hw.getMsg('untitled') + '</h1><br>';
  createForm['hw-name'].value = '';
  createForm['hw-thumb'].value = '';
  createForm['hw-template'].value = '';
  createForm['hw-save'].value = createForm['hw-save'].getAttribute('data-save');
  createForm['hw-save'].disabled = false;
  createForm['hw-separate'].checked = false;
  hw.separate();
  var section = createForm['hw-section-album'];
  createForm['hw-hidden'].checked = section.value && section.value != '_new_'
                                  ? section.options[section.selectedIndex].getAttribute('data-hidden') == 'true'
                                  : false;

  hw.changeThumbPreview();
  hw.htmlPreview();
  hw.$c('hw-wysiwyg').focus();
  hw.modify("move", "forward", "line");
  hw.modify("move", "forward", "line");
  hw.saveSelection();
};

hw.addToFeed = function(html) {
  // doing innerHTML += to the feed reloads the images at least in FF, hmmm
  var docFragment = document.createDocumentFragment();
  var div = document.createElement('div');
  div.innerHTML = html;
  docFragment.appendChild(div);
  hw.$('hw-feed').insertBefore(docFragment, hw.$('hw-feed').firstChild);
};

hw.save = function() {
  var createForm = hw.$c('hw-create');
  var response = hw.$c('hw-response');
  var finalHtml = "";

  if (hw.isHidden(createForm)) {
    return;
  }

  var callback = function(xhr) {
    // XXX TODO if creating a new album/section we'll get a reload which messes this up...
    if (!createForm['hw-id'].value) {
      var url = hw.baseUri() + /href="(.*?)"/.exec(xhr.responseText)[1];
      var externalSources = ['twitter', 'facebook', 'google'];
      for (var x = 0; x < externalSources.length; ++x) {
        var sourceEl = hw.$('hw-post-' + externalSources[x]);
        if (sourceEl && sourceEl.checked) {
          new hw.ajax(hw.baseUri() + externalSources[x],
            { method: 'post',
              postBody: 'url='                  + encodeURIComponent(url)
                      + '&title='               + encodeURIComponent(createForm['hw-title'].value)
                      + (hw.$c('hw-wysiwyg')    ? '&view=' + encodeURIComponent(finalHtml) : '')
                      + (createForm['hw-thumb'] ? '&thumb=' + encodeURIComponent(createForm['hw-thumb'].value) : ''),
              headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
              onSuccess: function() { },
              onError: function() { } });
        }
      }
    }

    hw.resetSaveState();

    if (createForm['hw-id'].value && xhr.getResponseHeader('Location')) {
      window.location.href = xhr.getResponseHeader('Location');
      return;
    }

    if (createForm['hw-id'].value && xhr.getResponseHeader('X-Helloworld-Thumbnail')) {
      createForm['hw-thumb'].value = xhr.getResponseHeader('X-Helloworld-Thumbnail');
      hw.changeThumbPreview();
    }

    if (createForm['hw-id'].value && xhr.getResponseHeader('X-Helloworld-Title')) {
      createForm['hw-title'].value = xhr.getResponseHeader('X-Helloworld-Title');
    }

    if (!createForm['hw-id'].value) {
      hw.setCookie('section', xhr.getResponseHeader('X-Helloworld-Section') || createForm['hw-section'].value, -1, hw.basePath());
      hw.setCookie('album', xhr.getResponseHeader('X-Helloworld-Album') || createForm['hw-album'].value, -1, hw.basePath());
    }

    if (!createForm['hw-id'].value) {
      hw.resetCreateForm();
      hw.addToFeed(xhr.responseText);
    }

    if (createForm['hw-section-album'] && createForm['hw-section-album'].value == '_new_') {
      createForm['hw-section-album'].value = '';
      window.location.reload();
    }

  };

  var badTrip = function(xhr) {
    createForm['hw-save'].value = createForm['hw-save'].getAttribute('data-save');
    createForm['hw-save'].disabled = false;

    if (xhr && xhr.responseText.indexOf('dup') == 0) {
      hw.options(true);
      var elName = xhr.responseText.split('-')[1];
      createForm['hw-' + elName].focus();
      createForm['hw-' + elName].select();
      hw.displayResponse(false, response.getAttribute('data-duplicate'));
    } else {
      hw.displayResponse(false, response.getAttribute('data-bad'));
    }
  };

  if (!createForm['hw-section'].value || createForm['hw-section'].value == '_new_') {
    badTrip();
    hw.options(true);
    createForm['hw-section'].focus();
    return;
  }

  createForm['hw-save'].value = createForm['hw-save'].getAttribute('data-saving');
  createForm['hw-save'].disabled = true;

  var section = createForm['hw-section'].value;
  var album = createForm['hw-album'] ? createForm['hw-album'].value : 'main';

  if (!createForm['hw-url'].value) {
    createForm['hw-url'].value = hw.baseUri()
        + createForm['hw-username'].value + '/'
        + section + '/'
        + (createForm['hw-name'].value ? createForm['hw-name'].value : '_');
  }

  var dateStart = createForm['hw-date-start'].value ? new Date(createForm['hw-date-start'].value).getTime() / 1000 : '';
  var dateEnd = createForm['hw-date-end'].value ? new Date(createForm['hw-date-end'].value).getTime() / 1000 : '';
  var sortType = createForm['hw-sort-type'] ? createForm['hw-sort-type'].value : "";
  var separate = createForm['hw-separate'].checked;

  var sendContent = function(mediaHTML, opt_title, opt_extraCallback) {
    var html = hw.$c('hw-wysiwyg').innerHTML;
    if (!createForm['hw-id'].value) {
      var newTitle = hw.$('hw-new-title');
      createForm['hw-title'].value = newTitle && newTitle.textContent != hw.getMsg('untitled') ? newTitle.textContent : '';

      if (newTitle) {
        var div = document.createElement('DIV');
        div.innerHTML = html;
        var titleInDiv = div.querySelector('#hw-new-title');
        if (titleInDiv) {
          if (titleInDiv.nextSibling && titleInDiv.nextSibling.nodeName == 'BR') {
            titleInDiv.parentNode.removeChild(titleInDiv.nextSibling);
          }
          titleInDiv.parentNode.removeChild(titleInDiv);
        }
        html = div.innerHTML;
      }
    }

    if (mediaHTML) {
      html = mediaHTML;
    }

    finalHtml = html; // passed to external sources in callback

    new hw.ajax(createForm['hw-url'].value,
      { method: !createForm['hw-id'].value ? 'post' : 'put',
        postBody: 'section='      + encodeURIComponent(section)
               + '&album='        + encodeURIComponent(album)
               + '&title='        + encodeURIComponent(opt_title || createForm['hw-title'].value)
               + '&price='        + encodeURIComponent(createForm['hw-price'].value)
               + '&thread='       + encodeURIComponent(createForm['hw-thread'].value)
               + '&date_start='   + encodeURIComponent(dateStart)
               + '&date_end='     + encodeURIComponent(dateEnd)
               + '&date_repeats=' + encodeURIComponent(createForm['hw-date-repeats'].value)
               + '&style='        + encodeURIComponent(createForm['hw-style'].value)
               + '&code='         + encodeURIComponent(createForm['hw-code'].value)
               + (hw.$c('hw-wysiwyg') ? '&view=' + encodeURIComponent(html) : '')
               + '&name='         + encodeURIComponent(separate ? '' : createForm['hw-name'].value)
               + (createForm['hw-thumb'] ? '&thumb=' + encodeURIComponent(createForm['hw-thumb'].value) : '')
               + '&template='     + encodeURIComponent(createForm['hw-template'].value)
               + '&sort_type='    + encodeURIComponent(sortType)
               + '&section_template=' + encodeURIComponent(createForm['hw-section-template'].value)
               + '&hidden='       + encodeURIComponent(createForm['hw-hidden'].checked ? 1 : 0),
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: opt_extraCallback || callback,
        onError: badTrip });
  };

  if (!separate) {
    sendContent('');
  } else {
    hw.prepareFilesAndSendOff(sendContent);
  }
};

hw.separate = function(el, forceEnable) {
  var separateCheckbox = hw.$c('hw-separate-checkbox');
  if (forceEnable) {
    separateCheckbox.checked = true;
  }
  var enabled = separateCheckbox.checked;
  hw.setClass(hw.$('hw-create'), 'hw-separate', enabled);

  if (enabled) {
    hw.options();
  }
};

hw.deleteContent = function(event) {
  hw.preventDefault(event);

  if (!window.confirm(hw.getMsg('confirm-delete'))) {
    return;
  }

  hw.changeBeforeUnloadState(null, true);

  var callback = function(xhr) {
    var next = hw.$c('hw-next');
    if (next && next.href) {
      window.location.href = next.href;
    } else {
      window.location.href = hw.baseUri() + 'dashboard';
    }
  };

  var badTrip = function(xhr) {
    alert(hw.$c('hw-response').getAttribute('data-bad'));
  };

  var createForm = hw.$c('hw-create');

  new hw.ajax(createForm['hw-url'].value,
    { method: 'delete',
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.deleteContentViaCollection = function(event, el) {
  hw.preventDefault(event);
  var li = el.parentNode;

  li.style.width = li.getBoundingClientRect().width + 'px';
  var func = function() {
    hw.addClass(li, 'hw-deleted');

    if (!window.confirm(hw.getMsg('confirm-delete'))) {
      hw.removeClass(li, 'hw-deleted');
      li.style.width = '';
      return;
    }

    var callback = function(xhr) {
      li.parentNode.removeChild(li);
    };

    var badTrip = function(xhr) {
      alert(hw.$c('hw-response').getAttribute('data-bad'));
      hw.removeClass(li, 'hw-deleted');
      li.style.width = '';
    };

    var createForm = hw.$c('hw-create');

    new hw.ajax(el.getAttribute('data-contenturl'),
      { method: 'delete',
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: callback,
        onError: badTrip });
  };
  setTimeout(func, 100);
};

hw.renameWorkaround = false;
hw.editSection = function(event, el, album) {
  // if we're not editing, renaming is not enabled
  if (hw.$('hw-container') && !hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  hw.preventDefault(event);

  var href = el.href + '?edit=true';
  if (hw.testAccelKey(event)) {
    window.open(href);
  } else {
    window.location.href = href;
  }
  return;

  // XXX disable renaming from sidebar, for now

  hw.addClass(el.parentNode, 'hw-renaming');
  el.parentNode.setAttribute('draggable', false);
  el.setAttribute('contenteditable', '');

  // XXX, this is lamesauce
  hw.renameWorkaround = true;
  el.blur();
  el.focus();
  hw.renameWorkaround = false;
};

hw.editContent = function(event, el) {
  if (hw.$('hw-container') && !hw.hasClass('hw-container', 'hw-editing')) {
    return false;
  }

  hw.preventDefault(event);

  var href = hw.sectionUrl + '/' + el.getAttribute('data-contentname') + '?edit=true';
  if (hw.testAccelKey(event)) {
    window.open(href);
  } else {
    window.location.href = href;
  }

  return true;
};

hw.renameKeyUp = function(event, el, album) {
  if (event.keyCode == 13 || event.keyCode == 27) { // enter or escape
    var fn = function() { hw.renameEnd(event, el, album, event.keyCode == 13); };
    setTimeout(fn, 0);
  }
};

hw.renameEnd = function(event, el, album, accept) {
  if (hw.renameWorkaround || !hw.hasClass(el.parentNode, 'hw-renaming')) {
    return;
  }

  hw.removeClass(el.parentNode, 'hw-renaming');
  el.parentNode.setAttribute('draggable', true);
  el.removeAttribute('contenteditable');

  if (accept) {
    var createForm = hw.$c('hw-create');
    var newName = hw.cleanName(el.textContent);
    el.href = el.href.substring(0, el.href.lastIndexOf('/')) + '/' + newName;
    el.setAttribute('data-original', el.textContent);
    var oldId = el.parentNode.id;
    el.parentNode.id = el.parentNode.id.substring(0, el.parentNode.id.lastIndexOf('_')) + '_' + newName;

    new hw.ajax(hw.baseUri() + 'api',
      { method: 'post',
        postBody: 'op='   + encodeURIComponent('rename')
               + '&type=' + encodeURIComponent(album ? 'album' : 'section')
               + '&id='   + encodeURIComponent(oldId)
               + '&new='  + encodeURIComponent(el.textContent),
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value } });
  } else {
    el.textContent = el.getAttribute('data-original');
  }

  el.blur();
};

hw.cleanName = function(name) {
  return name.replace(/ /g, "_").replace(/-/g, "_").replace(/[\W]+/g, '').replace(/_/g, "-").substring(0, 255);
};

hw.help = function(event) {
  hw.preventDefault(event);

  var help = hw.$c('hw-help');
  var openHelp = hw.isHidden(help);
  hw.setClass(hw.$c('hw-help-button'), 'hw-selected', openHelp);
  hw.display(help, openHelp);

  if (openHelp) {
    if (document.body.parentNode.scrollTop) {
      document.body.parentNode.scrollTop = document.body.parentNode.scrollTop + help.getBoundingClientRect().top - 100;
    } else {
      document.body.scrollTop = document.body.scrollTop + help.getBoundingClientRect().top - 100;
    }
  }
};
