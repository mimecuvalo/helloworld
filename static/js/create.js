hw.displayResponse = function(good, msg) {
  var response = hw.$c('hw-response');
  hw.removeClass(response, 'hw-invisible-reverse-transition');
  hw.addClass(response, 'hw-invisible-transition');
  hw.removeClass(response, 'hw-invisible');
  hw.setClass(response, 'hw-bad', !good);
  response.innerHTML = msg;
  var callback = function() {
    hw.removeClass(response, 'hw-invisible-transition');
    hw.addClass(response, 'hw-invisible-reverse-transition');
    hw.addClass(response, 'hw-invisible');
  };
  setTimeout(callback, 300);
};

hw.changeBeforeUnloadState = function(event, allowPageChange) {
  if (hw.$('hw-container') && !hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  window.onbeforeunload = allowPageChange ? null : function() { return "" };

  var createForm = hw.$c('hw-create');
  var title = "";
  if (!createForm['hw-id'].value) {
    var newTitle = hw.$('hw-new-title');
    title = newTitle && newTitle.textContent != hw.getMsg('untitled') ? newTitle.textContent : '(' + hw.getMsg('untitled') + ')';
  } else {
    title = createForm['hw-title'].value || '(' + hw.getMsg('untitled') + ')';
  }
  document.title = hw.contentOwnerTitle.replace(/&quot;/g, '"');
                + (hw.contentOwnerTitle && title ? ' - ' : '')
                + title.replace(/&quot;/g, '"');
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
  var section = createForm['hw-section-album'];
  createForm['hw-hidden'].checked = section.value && section.value != '_new_'
                                  ? section.options[section.selectedIndex].getAttribute('data-hidden') == 'true'
                                  : false;

  hw.changeThumbPreview();
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

  if (hw.isHidden(createForm)) {
    return;
  }

  var callback = function(xhr) {
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
      hw.resetCreateForm();
      hw.addToFeed(xhr.responseText);
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

  var sendContent = function(mediaHTML, opt_title, opt_extraCallback) {
    var separate = createForm['hw-separate'].checked;

    var html = hw.$c('hw-wysiwyg').innerHTML;
    if (!createForm['hw-id'].value) {
      var newTitle = hw.$('hw-new-title');
      createForm['hw-title'].value = newTitle && newTitle.textContent != hw.getMsg('untitled') ? newTitle.textContent : '';

      if (newTitle) {
        var div = document.createElement('DIV');
        div.innerHTML = html;
        var titleInDiv = div.querySelector('#hw-new-title');
        if (titleInDiv.nextSibling.nodeName == 'BR') {
          titleInDiv.parentNode.removeChild(titleInDiv.nextSibling);
        }
        titleInDiv.parentNode.removeChild(titleInDiv);
        html = div.innerHTML;
      }
    }

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
               + (hw.$c('hw-wysiwyg') ? '&view=' + encodeURIComponent(mediaHTML + html) : '')
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

  var mediaList = hw.$c('hw-media-list');
  var eventQueue = [];
  if (!mediaList || !mediaList.childNodes.length || createForm['hw-section-template'].value == 'links') {
    sendContent('');
  } else {
    for (var x = 0; x < mediaList.childNodes.length; ++x) {
      var iframe = mediaList.childNodes[x];
      var iframeDoc = iframe.contentWindow.document;
      var form = hw.$c('hw-create', iframeDoc);
      if (!form) {
        continue;
      }

      var container = hw.$c('hw-media-creator', iframeDoc);
      if (!hw.hasClass(container, 'hw-created')) {
        break;
      }

      form['hw-media-section'].value = createForm['hw-section'].value;
      form['hw-media-album'].value = createForm['hw-album'].value;
      form['hw-media-template'].value = createForm['hw-section-template'].value;

      eventQueue.push({ 'form': '', 'iframe': '' });
      eventQueue[eventQueue.length - 1]['form'] = form;
      eventQueue[eventQueue.length - 1]['iframe'] = iframe;
    }

    hw.processFiles(eventQueue, sendContent, "");
  }
};

hw.separate = function(el) {
  hw.setClass(hw.$('create'), 'hw-separate', el.checked);

  var mediaList = hw.$c('hw-media-list');

  for (var x = 0; x < mediaList.childNodes.length; ++x) {
    var doc = mediaList.childNodes[x].contentWindow.document;
    var mediaCreator = hw.$c('hw-media-creator', doc);
    if (mediaCreator) {
      hw.setClass(mediaCreator, 'hw-separate', el.checked);
    }
  }
};

hw.processFiles = function(eventQueue, sendContent, mediaHTML) {
  var createForm = hw.$c('hw-create');

  if (!eventQueue.length) {
    if (createForm['hw-separate'].checked) {
      hw.resetSaveState();
      hw.resetCreateForm();
    } else {
      sendContent(mediaHTML);
      if (!hw.hasClass(createForm, 'hw-new')) {
        hw.$c('hw-wysiwyg').innerHTML = mediaHTML + hw.$c('hw-wysiwyg').innerHTML;
        hw.htmlPreview();
      }
    }
    return;
  }

  var item = eventQueue.shift();
  var iframeDoc = item['iframe'].contentWindow.document;
  var iframeOnLoad = function(event, ajax) {
    if (!ajax) {
      var cssContent = hw.stylesheetCache ? hw.stylesheetCache : hw.generateStylesheetCache();
      var styleElement = document.createElement('style');
      styleElement.setAttribute('type', 'text/css');
      if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = cssContent;
      } else {
        styleElement.appendChild(document.createTextNode(cssContent));
      }
      item['iframe'].contentWindow.document.getElementsByTagName('head')[0].appendChild(styleElement);
    }

    var createForm = hw.$c('hw-create');
    var form = hw.$c('hw-uploaded', item['iframe'].contentWindow.document);

    if (form && form['hw-media-success'].value) {
      mediaHTML += form['hw-media-html'].value + '\n';

      var hideIframe = function() {
        hw.hide(item['iframe']);
        var lamesauce = function() {
          item['iframe'].setAttribute('style', 'width: 0px !important');
        };
        setTimeout(lamesauce, 300);
      };
      setTimeout(hideIframe, 3000);

      if (createForm['hw-separate'].checked || (form['hw-media-thumb'].value && !createForm['hw-thumb'].value)) {
        createForm['hw-thumb'].value = form['hw-media-thumb'].value;
        hw.changeThumbPreview();
      }

      if (createForm['hw-separate'].checked) {
        var callback = function(xhr) {
          hw.addToFeed(xhr.responseText);
          hw.processFiles(eventQueue, sendContent, mediaHTML);
        };
        sendContent(mediaHTML, form['hw-media-title'].value, callback);
        mediaHTML = "";
        return;
      }
    }

    hw.processFiles(eventQueue, sendContent, mediaHTML);
  };
  Event.observe(item['iframe'], 'load', iframeOnLoad, false);

  if (item['form']['hw-media-file'].value) {
    var iframeDoc = item['iframe'].contentWindow.document;
    var progress = hw.$c('hw-media-file-progress', iframeDoc);
    hw.removeClass(progress, 'hw-hidden');

    var transferProgress = function(e) {
      if (e.lengthComputable) {
        var percentage = Math.round((e.loaded * 100) / e.total);
        progress.setAttribute('value', percentage);
        progress.innerHTML = percentage + '%';
      }        
    };

    var onSuccess = function(xhr) {
      iframeDoc.body.innerHTML = xhr.responseText;
      iframeOnLoad(null, true);
    };

    var transferError = function(e) {
      hw.removeClass(hw.$c('hw-media-file-failed', iframeDoc), 'hw-hidden');

      // TODO maybe: we stop processing if we hit an error. best policy?
      //hw.processFiles(eventQueue, sendContent, mediaHTML);
      createForm['hw-save'].disabled = false;
      createForm['hw-save'].value = createForm['hw-save'].getAttribute('data-save');
      hw.$c('hw-wysiwyg').innerHTML = mediaHTML + hw.$c('hw-wysiwyg').innerHTML;
      hw.htmlPreview();

      hw.addClass(progress, 'hw-hidden');
    };

    item['form']['hw-media-local'].value = null;
    var formData = new FormData(item['form']);
    formData.append('hw-media-local', item['form']['hw-media-file']['file']);

    var uploadRequest = new hw.ajax(hw.uploadUrl,
      { upload: formData,
        onProgress: transferProgress,
        onSuccess: onSuccess,
        onError: transferError });

    if (!uploadRequest.transport.upload) {
      progress.setAttribute('max', '');
      item['form'].submit();
    }
  } else {
    item['form'].submit();
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
};
