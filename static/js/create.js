hw.displayResponse = function(good, msg) {
  var response = hw.getFirstElementByName('hw-response');
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
};

hw.resetSaveState = function() {
  var createForm = hw.getFirstElementByName('hw-create');
  var response = hw.getFirstElementByName('hw-response');

  hw.displayResponse(true, response.getAttribute('data-saved'));
  createForm['hw-save'].value = createForm['hw-save'].getAttribute('data-save');
  createForm['hw-save'].disabled = false;

  hw.changeBeforeUnloadState(null, true);
};

hw.resetCreateForm = function() {
  var createForm = hw.getFirstElementByName('hw-create');

  createForm['hw-title'].value = '';
  createForm['hw-price'].value = '0.00';
  createForm['hw-thread'].value = '';
  createForm['hw-date-start'].value = '';
  createForm['hw-date-end'].value = '';
  createForm['hw-date-repeats'].value = '';
  hw.getFirstElementByName('hw-wysiwyg').innerHTML = '';
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
  var createForm = hw.getFirstElementByName('hw-create');
  var response = hw.getFirstElementByName('hw-response');

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
               + (hw.getFirstElementByName('hw-wysiwyg') ? '&view=' + encodeURIComponent(mediaHTML + hw.getFirstElementByName('hw-wysiwyg').innerHTML) : '')
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

  var mediaList = hw.getFirstElementByName('hw-media-list');
  var eventQueue = [];
  if (!mediaList || !mediaList.childNodes.length || createForm['hw-section-template'].value == 'links') {
    sendContent('');
  } else {
    for (var x = 0; x < mediaList.childNodes.length; ++x) {
      var iframe = mediaList.childNodes[x];
      var iframeDoc = iframe.contentWindow.document;
      var form = hw.getFirstElementByName('hw-create', iframeDoc);
      if (!form) {
        continue;
      }

      var container = hw.getFirstElementByName('hw-media-creator', iframeDoc);
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

  var mediaList = hw.getFirstElementByName('hw-media-list');

  for (var x = 0; x < mediaList.childNodes.length; ++x) {
    var doc = mediaList.childNodes[x].contentWindow.document;
    var mediaCreator = hw.getFirstElementByName('hw-media-creator', doc);
    if (mediaCreator) {
      hw.setClass(mediaCreator, 'hw-separate', el.checked);
    }
  }
};

hw.processFiles = function(eventQueue, sendContent, mediaHTML) {
  var createForm = hw.getFirstElementByName('hw-create');

  if (!eventQueue.length) {
    if (createForm['hw-separate'].checked) {
      hw.resetSaveState();
      hw.resetCreateForm();
    } else {
      sendContent(mediaHTML);
      if (!hw.hasClass(createForm, 'hw-new')) {
        hw.getFirstElementByName('hw-wysiwyg').innerHTML = mediaHTML + hw.getFirstElementByName('hw-wysiwyg').innerHTML;
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

    var createForm = hw.getFirstElementByName('hw-create');
    var form = hw.getFirstElementByName('hw-uploaded', item['iframe'].contentWindow.document);

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
    var progress = hw.getFirstElementByName('hw-media-file-progress', iframeDoc);
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
      hw.removeClass(hw.getFirstElementByName('hw-media-file-failed', iframeDoc), 'hw-hidden');

      // TODO maybe: we stop processing if we hit an error. best policy?
      //hw.processFiles(eventQueue, sendContent, mediaHTML);
      createForm['hw-save'].disabled = false;
      createForm['hw-save'].value = createForm['hw-save'].getAttribute('data-save');
      hw.getFirstElementByName('hw-wysiwyg').innerHTML = mediaHTML + hw.getFirstElementByName('hw-wysiwyg').innerHTML;
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
    window.location.href = hw.baseUri() + 'dashboard';
  };

  var badTrip = function(xhr) {
    alert(hw.getFirstElementByName('hw-response').getAttribute('data-bad'));
  };

  var createForm = hw.getFirstElementByName('hw-create');

  new hw.ajax(createForm['hw-url'].value,
    { method: 'delete',
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.inForcedEditPage = false;
hw.edit = function(event, opt_dontCreateMediaIframe) {
  if (event) {
    hw.preventDefault(event);
  }

  // if page has code or we've started using the history api...
  if (!hw.inForcedEditPage && (hw.pageHasCode || hw.addedFirstUrlToHistory)) {
    window.location.href = window.location.pathname + '?edit=true';
    return;
  }

  // convert code back to normal
  if (hw.createAutoload && hw.inForcedEditPage && hw.pageHasCode) {
    hw.editScriptWorkaround();
  }

  hw.createAutoload = false;

  var createForm = hw.getFirstElementByName('hw-create');
  var turnEditingOn = hw.isHidden(createForm);

  // XXX, edge case: if you edit the page, then click 'edit' to close edit mode (without saving),
  // then, navigate to a neighbor page (which uses html5 history) you don't get
  // the onbeforeunload call for the page you were editing.
  // therefore, show force onbeforeunload to show up
  if (!turnEditingOn && window.onbeforeunload) {
    window.location.reload();
    return;
  }

  hw.setClass('hw-edit', 'hw-selected', turnEditingOn);
  if (hw.$('hw-container')) {
    hw.setClass('hw-container', 'hw-editing', turnEditingOn);
  }
  hw.display(createForm, turnEditingOn);
  if (!turnEditingOn) {
    hw.hideElementOptions();
  }
  createForm['hw-save'].disabled = false;
  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');

  if (hw.createIndividualContent) {
    if (turnEditingOn) {
      if (!opt_dontCreateMediaIframe) {
        hw.createMediaIframe();
      }
      wysiwyg.setAttribute('contenteditable', '');
    } else {
      wysiwyg.removeAttribute('contenteditable');
    }
  } else {
    hw.options();
    setTimeout(hw.setupCodeMirror, 0);
  }

  return false;
};

hw.editScriptWorkaround = function() {
  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');
  document.head.innerHTML = document.head.innerHTML.replace(/<style name="HWSCRIPTWORKAROUND"/g, '<script');
  document.head.innerHTML = document.head.innerHTML.replace(/<\/style><!--HWSCRIPTWORKAROUND-->/g, '</script>');
  wysiwyg.innerHTML = wysiwyg.innerHTML.replace(/<style name="HWSCRIPTWORKAROUND"/g, '<script');
  wysiwyg.innerHTML = wysiwyg.innerHTML.replace(/<\/style><!--HWSCRIPTWORKAROUND-->/g, '</script>');
};

// TODO: use ace editor? has wrapping at least...
// also has basic Vim emulation which could be extended for das geeks
// another example of vi emulation: http://gpl.internetconnection.net/vi/
hw.cm = null;
hw.setupCodeMirror = function() {
  if (hw.getFirstElementByName('hw-style-cm')) {
    return;
  }

  var onChange = function(editor) {
    editor.save();
    hw.htmlPreview(true, true);
  };

  var cm = CodeMirror.fromTextArea(hw.getFirstElementByName('hw-style'), { mode: "css", lineNumbers: true, matchBrackets: true, onChange: onChange });
  cm.getWrapperElement().setAttribute('name', 'hw-style-cm');
  cm.getWrapperElement().cm = cm;
  if (hw.createIndividualContent) {
    hw.hide(cm.getWrapperElement());
  }
  Event.observe(hw.getFirstElementByName('hw-style-cm'), 'keydown', hw.shortcuts, false);

  cm = CodeMirror.fromTextArea(hw.getFirstElementByName('hw-code'), { mode: "javascript", lineNumbers: true, matchBrackets: true, onChange: onChange });
  cm.getWrapperElement().setAttribute('name', 'hw-code-cm');
  cm.getWrapperElement().cm = cm;
  hw.hide(cm.getWrapperElement());
  Event.observe(hw.getFirstElementByName('hw-code-cm'), 'keydown', hw.shortcuts, false);

  if (hw.createIndividualContent) {
    hw.getFirstElementByName('hw-html').value = hw.getFirstElementByName('hw-html').value.replace(/>([^\n])/g, '>\n$1');
    hw.cm = CodeMirror.fromTextArea(hw.getFirstElementByName('hw-html'), { mode: "text/html", lineNumbers: true, matchBrackets: true, onChange: onChange });
    hw.cm.getWrapperElement().setAttribute('name', 'hw-html-cm');
    hw.cm.getWrapperElement().cm = hw.cm;
    hw.cm.focus();
    Event.observe(hw.getFirstElementByName('hw-html-cm'), 'keydown', hw.shortcuts, false);
  }
};

hw.optionsClick = function(event) {
  hw.preventDefault(event);

  hw.options();
};

hw.options = function(open) {
  var createForm = hw.getFirstElementByName('hw-create');
  var options = hw.getFirstElementByName('hw-options');
  var openOptions = open || hw.isHidden(options);
  hw.setClass(hw.getFirstElementByName('hw-more-options'), 'hw-selected', openOptions);
  hw.setClass(createForm, 'hw-options', openOptions);
  hw.display(options, openOptions);
  return false;
};

hw.sectionChange = function(section) {
  var createForm = hw.getFirstElementByName('hw-create');

  var oldTemplate = createForm['hw-section-template'].value;
  var newTemplate = '';
  if (section.value == '_new_' || createForm['hw-section-album'].value == '_new_') {
    hw.options(true);
    createForm['hw-section'].focus();
    createForm['hw-section'].select();
  } else if (section.value) {
    var section = createForm['hw-section-album'];
    var values = createForm['hw-section-album'].value.split('|');
    createForm['hw-section'].value = values[0];
    createForm['hw-album'].value = values[1] ? values[1] : '';
    createForm['hw-hidden'].checked = section.options[section.selectedIndex].getAttribute('data-hidden') == 'true';
    createForm['hw-section-template'].value = values[3] ? values[3] : (values[2] ? values[2] : '');
    newTemplate = createForm['hw-section-template'].value;
  }

  hw.templateChange(oldTemplate, newTemplate);
};

hw.templateChange = function(oldTemplate, newTemplate) {
  if (!oldTemplate) {
    oldTemplate = hw.getFirstElementByName('hw-template').getAttribute('data-previous');
  }
  hw.removeClass(hw.getFirstElementByName('hw-playground'), 'hw-template-' + oldTemplate);
  hw.addClass(hw.getFirstElementByName('hw-playground'), 'hw-template-' + newTemplate);
  hw.removeClass(hw.getFirstElementByName('hw-wysiwyg'), 'hw-template-' + oldTemplate);
  hw.addClass(hw.getFirstElementByName('hw-wysiwyg'), 'hw-template-' + newTemplate);
  hw.removeClass(hw.getFirstElementByName('hw-create'), 'hw-template-' + oldTemplate);
  hw.addClass(hw.getFirstElementByName('hw-create'), 'hw-template-' + newTemplate);

  hw.getFirstElementByName('hw-template').setAttribute('data-previous', newTemplate)
};

hw.shortcuts = function(event) {
  var key = event.which ? event.which : event.keyCode;

  //hw.hideUserAutocomplete();

  switch (key) {
    //case 64:    // @-symbol, autocomplete remote_user
    //  hw.showUserAutocomplete();
    //  break;
    case 83:   // ctrl-s, save
      if (hw.testAccelKey(event)) {
        hw.preventDefault(event);
        hw.save();
        return;
      }
    default:
      break;
  }

  setTimeout(hw.htmlPreview, 0);
};


hw.wysiwyg = function(event, cmd, value, el) {
  hw.preventDefault(event);

  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');
  wysiwyg.focus();
  var skipExec = false;

  if (cmd == "createLink") {
    var startNode = hw.getSelectionStartNode();
    if (startNode.nodeName == 'A') {
      skipExec = true;
      var fragment = document.createDocumentFragment();
      for (var x = 0; x < startNode.childNodes.length; ++x) {
        fragment.appendChild(startNode.childNodes[x]);
      }
      startNode.parentNode.replaceChild(fragment, startNode);
      hw.hideElementOptions();
      return;
    } else {
      if (!hw.selection.toString()) {
        return;
      }
      value = "http://";
    }
  }

  try {
    if (!skipExec) {
      document.execCommand(cmd, false, value);
    }
  } catch(ex) {
    // XXX, formatBlock messes up sometimes
    if (cmd == "formatBlock") {
      var br = document.createElement('br');
      wysiwyg.insertBefore(br, wysiwyg.firstChild);
      var range = document.createRange();
      range.setStart(br, 0);
      document.execCommand(cmd, false, value);
    }
  }

  if (el) {
    hw.setClass(el, 'hw-selected', !hw.hasClass(el, 'hw-selected'));
  }

  hw.wysiwygDetectState();
  hw.htmlPreview();

  if (cmd == "createLink") {
    var anchorTag = hw.getSelectionStartNode(true).nextSibling;
    hw.showAnchorEditor(anchorTag);
    hw.getFirstElementByName('hw-anchor-link').value = 'http://';
    hw.getFirstElementByName('hw-anchor-visit').href = '';
    hw.getFirstElementByName('hw-anchor-link').focus();
    hw.getFirstElementByName('hw-anchor-link').select();
  }
};

hw.wysiwygDetectState = function() {
  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');

  if (!wysiwyg.hasAttribute('contenteditable')) {
    return;
  }

  wysiwyg.focus();

  var features = ['bold', 'italic', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'];
  for (var x = 0; x < features.length; ++x) {
    var control = hw.getFirstElementByName('hw-' + features[x]);
    hw.setClass(control, 'hw-selected', document.queryCommandState(features[x]));
  }

  hw.getFirstElementByName('hw-fontSize').value = document.queryCommandValue('fontSize') || "2";

  var isAnchor = hw.getSelectionStartNode().nodeName == 'A';
  hw.setClass(hw.getFirstElementByName('hw-createLink'), 'hw-selected', isAnchor);
  if (isAnchor) {
    hw.showAnchorEditor();
  } else {
    hw.hideAnchorEditor();
  }

  var images = hw.getSelectionStartNode().getElementsByTagName('IMG');
  var isImage = images.length && images[0].parentNode == hw.getSelectionStartNode();  // only look at children, not descendants
  if (isImage) {
    hw.showImageOptions();
  } else {
    hw.hideImageOptions();
  }
};

hw.hideElementOptions = function() {
  hw.hideUserAutocomplete();
  hw.hideAnchorEditor();
  hw.hideImageOptions();
};

hw.showAnchorEditor = function(anchor) {
  var anchorTag = anchor || hw.getSelectionStartNode();
  hw.getFirstElementByName('hw-anchor-link')['anchorTag'] = anchorTag;
  var anchorPosition = anchorTag.getBoundingClientRect();
  var contentPosition = hw.$('hw-content') ? hw.$('hw-content').getBoundingClientRect() : document.body.getBoundingClientRect();
  hw.getFirstElementByName('hw-anchor-editor').style.top = (window.pageYOffset + 15 + anchorPosition.top) + 'px';
  hw.getFirstElementByName('hw-anchor-editor').style.left = (anchorPosition.left + 5 - contentPosition.left) + 'px';
  hw.getFirstElementByName('hw-anchor-link').value = anchorTag.href;
  hw.getFirstElementByName('hw-anchor-visit').href = anchorTag.href;
  hw.getFirstElementByName('hw-anchor-type').checked = anchorTag.href.indexOf('mailto:') != 0;
  hw.getElementsByName('hw-anchor-type')[1].checked = anchorTag.href.indexOf('mailto:') == 0;
};

hw.hideAnchorEditor = function() {
  if (hw.getFirstElementByName('hw-anchor-editor')) {
    hw.getFirstElementByName('hw-anchor-editor').style.top = '-10000px';
    hw.getFirstElementByName('hw-anchor-editor').style.left = '-10000px';
  }
};

hw.changeAnchorType = function(el) {
  var link = hw.getFirstElementByName('hw-anchor-link');
  el.checked = true;
  if (el.value == 'web' && link.value.indexOf('mailto:') == 0) {
    hw.getFirstElementByName('hw-anchor-link').value = 'http://';
    hw.getFirstElementByName('hw-anchor-visit').href = '';
    hw.getFirstElementByName('hw-anchor-link').focus();
  } else if (el.value == 'email' && link.value.indexOf('mailto:') != 0) {
    hw.getFirstElementByName('hw-anchor-link').value = 'mailto:';
    hw.getFirstElementByName('hw-anchor-visit').href = '';
    hw.getFirstElementByName('hw-anchor-link').focus();
  }
};

hw.changeAnchorLink = function(el) {
  hw.getFirstElementByName('hw-anchor-visit').href = el.value;
  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');
  wysiwyg.focus();
  var anchorTag = hw.getFirstElementByName('hw-anchor-link')['anchorTag'];
  anchorTag.href = el.value;
};

hw.showImageOptions = function(image) {
  var imageTag;
  if (image) {
    imageTag = image;
  } else {
    imageTag = hw.getSelectionStartNode().getElementsByTagName('IMG')[0];
  }
  hw.getFirstElementByName('hw-image-options')['imageTag'] = imageTag;
  var imagePosition = imageTag.getBoundingClientRect();
  var contentPosition = hw.$('hw-content') ? hw.$('hw-content').getBoundingClientRect() : document.body.getBoundingClientRect();
  hw.getFirstElementByName('hw-image-options').style.top = (window.pageYOffset + imagePosition.top
      + hw.getFirstElementByName('hw-anchor-editor').getBoundingClientRect().height + 25) + 'px';
  hw.getFirstElementByName('hw-image-options').style.left = (imagePosition.left + 5 - contentPosition.left) + 'px';
  hw.getFirstElementByName('hw-image-align').checked = imageTag.style.cssFloat == '' || imageTag.style.float == 'none';
  hw.getElementsByName('hw-image-align')[1].checked = imageTag.style.cssFloat == 'left';
  hw.getElementsByName('hw-image-align')[1].checked = imageTag.style.cssFloat == 'right';
};

hw.hideImageOptions = function() {
  if (hw.getFirstElementByName('hw-image-options')) {
    hw.getFirstElementByName('hw-image-options').style.top = '-10000px';
    hw.getFirstElementByName('hw-image-options').style.left = '-10000px';
  }
};

hw.changeImageAlign = function(el) {
  el.checked = true;
  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');
  wysiwyg.focus();
  var imageTag = hw.getFirstElementByName('hw-image-options')['imageTag'];
  imageTag.style.cssFloat = el.value;

  if (imageTag.parentNode.nodeName == 'A') {
    imageTag.parentNode.style.cssFloat = el.value;

    if (imageTag.parentNode.parentNode.nodeName == 'FIGURE') {
      imageTag.parentNode.parentNode.style.cssFloat = el.value;
    }
  }
};

hw.showUserAutocomplete = function() {
  if (!hw.remoteUsers) {
    return;
  }

  var node = hw.getSelectionStartNode();
  var users = hw.getFirstElementByName('hw-user-autocomplete');

  var html = "";
  for (var x = 0; x < hw.remoteUsers.length; ++x) {
    html += '<div>' + hw.remoteUsers[x].username + '</div>';
  }
  users.innerHTML = html;

  var contentPosition = hw.$('hw-content') ? hw.$('hw-content').getBoundingClientRect() : hw.getFirstElementByName('hw-wysiwyg').getBoundingClientRect();
  users.style.top = (window.pageYOffset + node.getBoundingClientRect().top + contentPosition.top) + 'px';
  users.style.left = (node.getBoundingClientRect().left + 5) + 'px';
};
hw.hideUserAutocomplete = function() {
  
};

hw.selection = 0;
hw.saveSelection = function() {
  if (window.getSelection) {
    var sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      hw.selection = sel.getRangeAt(0);
    }
  } else if (document.selection && document.selection.createRange) {
    hw.selection = document.selection.createRange();
  } else {
    hw.selection = null;
  }

  hw.wysiwygDetectState();
};

hw.restoreSelection = function() {
  if (hw.selection) {
    if (window.getSelection) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(hw.selection);
    } else if (document.selection && hw.selection.select) {
      hw.selection.select();
    }
  }
};

hw.getSelectionStartNode = function(allowTextNodes) {
  var node, selection;
  if (window.getSelection) {
    selection = window.getSelection();
    node = selection.anchorNode;
  }
  if (!node && document.selection) { // IE
    selection = document.selection;
    var range = selection.getRangeAt ? selection.getRangeAt(0) : selection.createRange();
    node = range.commonAncestorContainer
              ? range.commonAncestorContainer
              : range.parentElement ? range.parentElement() : range.item(0);
  }
  if (node) {
    return (node.nodeName == "#text" && !allowTextNodes ? node.parentNode : node);
  }
};

hw.html = function(event, el, close) {
  if (event) {
    hw.preventDefault(event);
  }

  if (!close) {
    hw.mediaLibrary(null, null, true);
  }

  var html = hw.getFirstElementByName('hw-html-toggle');
  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');
  var htmlWrapper = hw.getFirstElementByName('hw-html-wrapper');
  var openHTML = close ? false : hw.isHidden(htmlWrapper);
  hw.setClass(html, 'hw-selected', openHTML);
  var createForm = hw.getFirstElementByName('hw-create');
  hw.setClass(wysiwyg, 'hw-html', openHTML);
  hw.setClass(createForm, 'hw-html', openHTML);
  hw.display(htmlWrapper, openHTML);
  hw.htmlPreview();
  var fn = function() { hw.createOnScroll(); }
  setTimeout(fn, 300);
  html.focus();
  hw.hideElementOptions();

  setTimeout(hw.setupCodeMirror, 0);
};

hw.htmlTab = function(el) {
  var child = hw.getFirstElementByName('hw-html-wrapper').firstChild;
  var tabName = el.getAttribute('name');
  while (child) {
    if (child.nodeName != "TEXTAREA" && child.nodeName != "DIV") {
      child = child.nextSibling;
      continue;
    }
    hw.display(child, tabName.split('-')[1] == child.getAttribute('name').split('-')[1]);
    if (child.cm) {
     child.cm.refresh(); 
    }
    child = child.nextSibling;
  }

  var child = hw.getFirstElementByName('hw-html-tabs').firstChild;
  while (child) {
    if (child.nodeName != "LI") {
      child = child.nextSibling;
      continue;
    }
    hw.setClass(child, 'hw-selected', tabName == child.getAttribute('name'));
    child = child.nextSibling;
  }
};

hw.htmlPreview = function(force, codeMirror) {
  var createForm = hw.getFirstElementByName('hw-create');
  var html = hw.getFirstElementByName('hw-html');
  var htmlCM = hw.getFirstElementByName('hw-html-cm');
  var htmlCMTextarea = htmlCM ? htmlCM.getElementsByTagName('textarea')[0] : null;
  var style = hw.getFirstElementByName('hw-style');
  var styleCM = hw.getFirstElementByName('hw-style-cm');
  var styleCMTextarea = styleCM ? styleCM.getElementsByTagName('textarea')[0] : null;
  var code = hw.getFirstElementByName('hw-code');
  var codeCM = hw.getFirstElementByName('hw-code-cm');
  var codeCMTextarea = codeCM ? codeCM.getElementsByTagName('textarea')[0] : null;
  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');
  var htmlWrapper = hw.getFirstElementByName('hw-html-wrapper');

  hw.changeBeforeUnloadState();

  if (!force && hw.isHidden(hw.getFirstElementByName('hw-html-wrapper'))) {
    return;
  }

  if (codeMirror && document.activeElement != htmlCMTextarea
                 && document.activeElement != styleCMTextarea
                 && document.activeElement != codeCMTextarea) {
    return;
  }

  if (document.activeElement == html || document.activeElement == htmlCMTextarea) {
    wysiwyg.innerHTML = html.value;
  } else if (document.activeElement != styleCMTextarea && document.activeElement != codeCMTextarea) {
    if (!hw.isHidden(htmlWrapper)) {
      html.value = wysiwyg.innerHTML;
      if (hw.cm) {
        hw.cm.setValue(html.value.replace(/>([^\n])/g, '>\n$1'));
      }
    }
  }

  if (document.activeElement == wysiwyg) {
    return;
  }

  if (!hw.$('hw-preview-style')) {
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.id = 'hw-preview-style';
    document.getElementsByTagName('head')[0].appendChild(styleElement);
  }

  var styleElement = hw.$('hw-content-style') ? hw.$('hw-content-style') : hw.$('hw-preview-style');
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = style.value;
   } else {
    styleElement.innerHTML = style.value;
  }

  var jsCode = code.value;
  var jsPattern = "<script[^>]*src=['\"]([^>]*)['\"]></script>";
  var jsRe = new RegExp(jsPattern, "ig");
  var jsSingleRe = new RegExp(jsPattern, "i");
  var jsExternalScripts = jsCode.match(jsRe);
  jsCode = jsCode.replace(jsRe, '');
  if (jsExternalScripts) {
    for (var x = 0; x < jsExternalScripts.length; ++x) {
      var jsSource = jsExternalScripts[x].match(jsSingleRe)[1];
      var existingRe = new RegExp("<script[^>]*src=['\"]" + jsSource + "['\"]></script>", "ig");
      if (document.head.innerHTML.match(existingRe)) {
        continue;
      }
      var scriptElement = document.createElement('script');
      scriptElement.src = jsSource;
      document.getElementsByTagName('head')[0].appendChild(scriptElement);
    }
  }

  jsCode = jsCode.replace('<script>', '');
  jsCode = jsCode.replace('</script>', '');

  try {
    eval(jsCode);
  } catch(ex) {
    return;
  }

  if (hw.$('hw-preview-script')) {
    document.getElementsByTagName('head')[0].removeChild(hw.$('hw-preview-script'));
  }

  var scriptElement = document.createElement('script');
  scriptElement.text = jsCode;
  scriptElement.id = 'hw-preview-script';
  document.getElementsByTagName('head')[0].appendChild(scriptElement);
};

hw.newMedia = function(doc, remote, file) {
  var createForm = hw.getFirstElementByName('hw-create');
  var mediaCreator = hw.getFirstElementByName('hw-media-creator', doc);
  hw.addClass(mediaCreator, 'hw-created');
  hw.setClass(mediaCreator, 'hw-separate', createForm['hw-separate'].checked);

  var oppositeSource = remote ? hw.getFirstElementByName('hw-media-local', doc)
                              : hw.getFirstElementByName('hw-media-remote', doc);
  oppositeSource.value = '';
  hw.addClass(oppositeSource, 'hw-initial');

  if (file) {
    hw.addClass(mediaCreator, 'hw-file');
    var fileInput = hw.getFirstElementByName('hw-media-file', doc);
    hw.removeClass(fileInput, 'hw-hidden');
    fileInput.value = file.name;
    fileInput['file'] = file;
  }

  if (!remote) {
    hw.getFirstElementByName('hw-media-local', doc).removeAttribute('multiple');
  }

  if (remote) {
    hw.newMediaPreview(doc, remote, hw.getFirstElementByName('hw-media-remote', doc).value);
  } else {
    hw.newMediaPreview(doc, remote, file);
  }

  hw.changeBeforeUnloadState();
};

hw.newMediaPreview = function(doc, remote, source) {
  var preview = hw.getFirstElementByName('hw-media-preview', doc);
  var previewWrapper = hw.getFirstElementByName('hw-media-preview-wrapper', doc);
  var filename = source;

  if (!remote) {
    if (source && ((window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL))) {
      filename = source.name;
      source = window.URL ? window.URL.createObjectURL(source) : window.webkitURL.createObjectURL(source);
    } else {
      hw.hide(previewWrapper);
      return;
    }
  }

  var filetype = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  var isImage = false;
  var imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'apng', 'bmp', 'ico'];
  for (var x = 0; x < imageExtensions.length; ++x) {
    if (filetype == imageExtensions[x]) {
      isImage = true;
    }
  }

  if (isImage) {
    preview.src = source;
    hw.show(previewWrapper);
  } else {
    hw.hide(previewWrapper);
  }
};

hw.editImage = function(event, el) {
  hw.preventDefault(event);

  var editor = hw.getFirstElementByName('hw-image-editor');
  editor.__hw_image = hw.getFirstElementByName('hw-media-preview', el.ownerDocument);
  editor.__hw_media_doc = el.ownerDocument;

  if (!hw.hasClass(hw.getFirstElementByName('hw-media-creator', el.ownerDocument), 'hw-file')) {
    return;
  }

  hw.show(editor);
  editor.style.left = editor.getBoundingClientRect().left + 'px';
  editor.style.top = editor.getBoundingClientRect().top + 'px';
  editor.style.marginLeft = 0;

  var img = hw.getFirstElementByName('hw-image-scratch');
  if (!img) {
    var canvas = hw.editImageCanvas();
    Pixastic.revert(canvas);
    img = hw.getFirstElementByName('hw-image-scratch');

    var parentNode = img.parentNode;
    parentNode.removeChild(img);
    var newImg = document.createElement('img');
    newImg.setAttribute('name', 'hw-image-scratch');
    parentNode.appendChild(newImg);
    img = newImg;
  }

  img.src = editor.__hw_image.src;
  hw.removeClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');
  Pixastic.process(img, "rotate", {angle: 0}, hw.editImageResetForm);  // convert to canvas, noop
};
hw.editImageCanvas = function() {
  return hw.getFirstElementByName('hw-image-editor').getElementsByTagName('canvas')[0];
};
hw.editImageSave = function(event) {
  var editor = hw.getFirstElementByName('hw-image-editor');
  var canvas = hw.editImageCanvas();
  var parentNode = editor.__hw_image.parentNode;
  parentNode.removeChild(editor.__hw_image);
  var newImg = document.createElement('img');
  newImg.src = canvas.toDataURL();
  newImg.setAttribute('name', 'hw-media-preview');
  parentNode.insertBefore(newImg, parentNode.firstChild);

  var mediaCreator = hw.getFirstElementByName('hw-media-creator', editor.__hw_media_doc);
  var remoteSource = hw.getFirstElementByName('hw-media-remote', editor.__hw_media_doc);
  var fileInput = hw.getFirstElementByName('hw-media-file', editor.__hw_media_doc);

  var fileName;
  if (hw.hasClass(mediaCreator, 'hw-file')) {
    fileName = fileInput.value;
  } else if (!hw.addClass(remoteSource, 'hw-initial')) {
    fileName = remoteSource.value;
  } else {
    fileName = hw.getFirstElementByName('hw-media-local', editor.__hw_media_doc).value;
  }

  remoteSource.value = '';
  hw.addClass(remoteSource, 'hw-initial');

  hw.addClass(mediaCreator, 'hw-file');
  hw.removeClass(fileInput, 'hw-hidden');
  fileInput['file'] = canvas.toBlob ? canvas.toBlob() : canvas.mozGetAsFile(fileName);
  fileInput.value = fileName;

  hw.editImageClose();
};
hw.editImageClose = function(event) {
  if (event) {
    hw.preventDefault(event);
  }
  var editor = hw.getFirstElementByName('hw-image-editor');
  hw.hide(editor);
  editor.style.left = '50%';
  editor.style.top = '36px';
  editor.style.marginLeft = '-450px';
};
hw.editImageRotate = function(event) {
  var temp = hw.getFirstElementByName('hw-image-width').value;
  hw.getFirstElementByName('hw-image-width').value = hw.getFirstElementByName('hw-image-height').value;
  hw.getFirstElementByName('hw-image-width').setAttribute('data-previous', hw.getFirstElementByName('hw-image-width').value);
  hw.getFirstElementByName('hw-image-height').value = temp;
  hw.rangeSet(hw.getFirstElementByName('hw-image-width'), null, hw.getFirstElementByName('hw-image-width').value);

  var canvas = hw.editImageCanvas();
  hw.removeClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');
  Pixastic.process(canvas, "rotate", { angle: -90 });
  hw.addClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');
  canvas = hw.editImageCanvas();
  var img = document.createElement('img');
  img.setAttribute('name', 'hw-image-scratch');
  img.src = canvas.toDataURL();
  canvas.__scratchImage = img;
};
hw.editImageWidth = function(el) {
  var canvas = hw.editImageCanvas();
  var ratio = hw.editImageDidCrop ? hw.getFirstElementByName('hw-image-height').value / hw.getFirstElementByName('hw-image-width').getAttribute('data-previous')
                                  : canvas.__pixastic_org_height / canvas.__pixastic_org_width;
  hw.getFirstElementByName('hw-image-height').value = Math.max(1, parseInt(el.value * ratio));
  hw.getFirstElementByName('hw-image-width').setAttribute('data-previous', el.value);
  hw.editImageProcess();
};
hw.editImageBrightness = function(el) {
  hw.editImageProcess();
};
hw.editImageContrast = function(el) {
  hw.editImageProcess();
};
hw.editImageProcess = function() {
  if (hw.getFirstElementByName('hw-image-preview').checked) {
    hw.editImageRevert(true);
    var canvas = hw.editImageCanvas();
    var scratch = canvas.__scratchImage;
    var resizeOptions = { width: hw.getFirstElementByName('hw-image-width').value, height: hw.getFirstElementByName('hw-image-height').value };
    hw.removeClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');
    Pixastic.process(canvas, "resize", resizeOptions);

    canvas = hw.editImageCanvas();
    var brightnessOptions = { brightness: hw.getFirstElementByName('hw-image-brightness').value, contrast: hw.getFirstElementByName('hw-image-contrast').value };
    Pixastic.process(canvas, "brightness", brightnessOptions);
    hw.addClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');

    canvas = hw.editImageCanvas();
    canvas.__scratchImage = scratch;
  }
};
hw.editImageCropMode = false;
hw.editImageCropStart = null;
hw.editImageDidCrop = false;
hw.editImageCrop = function() {
  var canvas = hw.editImageCanvas();
  var editor = hw.getFirstElementByName('hw-image-editor');
  hw.editImageCropMode = !hw.editImageCropMode;
  if (hw.$('hw-image-crop-rect')) {
    hw.$('hw-image-crop-rect').parentNode.removeChild(hw.$('hw-image-crop-rect'));
  }
  if (hw.editImageCropMode) {
    Event.observe(canvas, 'mousedown', hw.cropMouseDown, false);
    Event.observe(editor, 'mousemove', hw.cropMouseMove, false);
    Event.observe(canvas, 'mouseup', hw.cropMouseUp, false);
    hw.getFirstElementByName('hw-image-crop').innerHTML = hw.getFirstElementByName('hw-image-crop').getAttribute('data-select-area');
  } else {
    Event.stopObserving(canvas, 'mousedown', hw.cropMouseDown, false);
    Event.stopObserving(editor, 'mousemove', hw.cropMouseMove, false);
    Event.stopObserving(canvas, 'mouseup', hw.cropMouseUp, false);
    hw.getFirstElementByName('hw-image-crop').innerHTML = hw.getFirstElementByName('hw-image-crop').getAttribute('data-crop');
    hw.editImageCropStart = null;
  }
};
hw.cropMouseDown = function(event) {
  hw.editImageCropStart = { top: event.clientY - event.target.getBoundingClientRect().top,
                            left: event.clientX - event.target.getBoundingClientRect().left };
  var editor = hw.getFirstElementByName('hw-image-editor');
  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.height = '1px';
  div.style.width = '1px';
  div.style.top = (event.clientY - editor.getBoundingClientRect().top) + 'px';
  div.style.left = (event.clientX- editor.getBoundingClientRect().left) + 'px';
  div.style.border = '1px dotted gray';
  div.setAttribute('id', 'hw-image-crop-rect');
  hw.getFirstElementByName('hw-image-editor').appendChild(div);
};
hw.cropMouseMove = function(event) {
  if (hw.editImageCropStart) {
    var canvas = hw.editImageCanvas();
    hw.$('hw-image-crop-rect').style.width = (event.clientX - hw.editImageCropStart.left - canvas.getBoundingClientRect().left - 5) + 'px';
    hw.$('hw-image-crop-rect').style.height = (event.clientY - hw.editImageCropStart.top - canvas.getBoundingClientRect().top - 5) + 'px';
  }
};
hw.cropMouseUp = function(event) {
  if (!hw.editImageCropStart) {
    return;
  }

  if (hw.getFirstElementByName('hw-image-width').value > 650) {  // 650 == size of upload resize
    hw.getFirstElementByName('hw-image-width').value = 650;
    hw.editImageWidth(hw.getFirstElementByName('hw-image-width'));
  }

  var canvas = hw.editImageCanvas();
  var options = { rect: { top: hw.editImageCropStart.top, left: hw.editImageCropStart.left,
                          height: event.clientY - hw.editImageCropStart.top - canvas.getBoundingClientRect().top,
                          width: event.clientX - hw.editImageCropStart.left - canvas.getBoundingClientRect().left } };
                          
  hw.removeClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');
  Pixastic.process(canvas, "crop", options);
  hw.addClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');
  hw.editImageDidCrop = true;
  canvas = hw.editImageCanvas();
  hw.getFirstElementByName('hw-image-width').value = canvas.getBoundingClientRect().width;
  hw.getFirstElementByName('hw-image-width').setAttribute('data-previous', hw.getFirstElementByName('hw-image-width').value);
  hw.getFirstElementByName('hw-image-height').value = canvas.getBoundingClientRect().height;
  hw.rangeSet(hw.getFirstElementByName('hw-image-width'), null, hw.getFirstElementByName('hw-image-width').value);
  hw.$('hw-image-crop-rect').parentNode.removeChild(hw.$('hw-image-crop-rect'));
  var img = document.createElement('img');
  img.src = canvas.toDataURL();
  img.setAttribute('name', 'hw-image-scratch');
  canvas.__scratchImage = img;
  hw.editImageCropStart = null;
  hw.editImageCrop();
};
hw.editImageRevert = function(dontResetForm) {
  var canvas = hw.editImageCanvas();
  var didScratchHack = false;
  if (dontResetForm && canvas.__scratchImage) {
    didScratchHack = true;
    var tempImage = canvas.__pixastic_org_image;
    var tempWidth = canvas.__pixastic_org_width;
    var tempHeight = canvas.__pixastic_org_height;
    var tempScratchImage = canvas.__scratchImage;
    canvas.__pixastic_org_image = canvas.__scratchImage;
    canvas.__pixastic_org_width = hw.getFirstElementByName('hw-image-width').value;
    canvas.__pixastic_org_height = hw.getFirstElementByName('hw-image-height').value;
  }
  Pixastic.revert(canvas);
  var img = hw.getFirstElementByName('hw-image-scratch');
  hw.removeClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');
  Pixastic.process(img, "rotate", {angle: 0});  // convert to canvas, noop
  hw.addClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');

  if (didScratchHack) {
    canvas = hw.editImageCanvas();
    canvas.__pixastic_org_image = tempImage;
    canvas.__pixastic_org_width = tempWidth;
    canvas.__pixastic_org_height = tempHeight;
    canvas.__scratchImage = tempScratchImage;
  }

  if (!dontResetForm) {
    hw.editImageResetForm();
  }
};
hw.editImageResetForm = function() {
  var canvas = hw.editImageCanvas();
  hw.editImageDidCrop = false;
  hw.getFirstElementByName('hw-image-brightness').value = 0;
  hw.getFirstElementByName('hw-image-contrast').value = 0;
  hw.getFirstElementByName('hw-image-width').value = canvas.__pixastic_org_width;
  hw.getFirstElementByName('hw-image-height').value = canvas.__pixastic_org_height;
  hw.getFirstElementByName('hw-image-width').setAttribute('data-previous', canvas.__pixastic_org_width);
  hw.rangeSet(hw.getFirstElementByName('hw-image-brightness'), null, 0);
  hw.rangeSet(hw.getFirstElementByName('hw-image-contrast'), null, 0);
  hw.rangeSet(hw.getFirstElementByName('hw-image-width'), null, canvas.__pixastic_org_width);
  hw.addClass(hw.getFirstElementByName('hw-image-editor'), 'hw-editing');
};
hw.rangeStart = function(event, el) {
  el.setAttribute('data-moving', 'true');
  hw.rangeSet(el, event);
};
hw.rangeMove = function(event, el) {
  if (el.getAttribute('data-moving')) {
    hw.rangeSet(el, event);
  }
};
hw.rangeSet = function(el, event, value) {
  var min = Number(el.getAttribute('min'));
  var max = Number(el.getAttribute('max'));
  var step = Number(el.getAttribute('step'));
  var sliderWidth = 12;
  var x;

  if (event) {
    x = Math.max(0, event.clientX - el.getBoundingClientRect().left - sliderWidth / 2);
    x = Math.min(x, el.getBoundingClientRect().width - sliderWidth);
  } else {
    x = (value - min) / (max - min) * (el.getBoundingClientRect().width - sliderWidth);
  }

  var rawValue = x / (el.getBoundingClientRect().width - sliderWidth) * (max - min) + min;
  rawValue = (rawValue * 1 / step).toFixed(0) * step;
  var fraction = step - parseInt(step);
  if (fraction) {
    rawValue = rawValue.toFixed((1 / fraction / 10).toFixed(0).length + 1);
  }
  rawValue = Number(rawValue);
  el.value = rawValue;

  x = (rawValue - min) / (max - min) * (el.getBoundingClientRect().width - sliderWidth);
  el.style.backgroundPosition = x + 'px 2px';
};
hw.rangeEnd = function(event, el) {
  if (el.getAttribute('data-moving')) {
    el.onchange();
  }
  el.setAttribute('data-moving', '');
};
hw.editImagePreview = function(el) {
  if (el.checked) {
    hw.editImageProcess();
  } else {
    hw.editImageRevert(true);
  }
};

hw.stylesheetCache = '';
hw.generateStylesheetCache = function() {
  var cssContent = '';
  if (!hw.$('hw-stylesheet').styleSheet) {
    var rules = hw.$('hw-stylesheet').sheet.cssRules;
    for (var x = 0; x < rules.length; ++x) {
      cssContent += rules[x].cssText;
    }
  } else {
    cssContent = hw.$('hw-stylesheet').styleSheet.cssText;    // workaround ie < 9
  }
  if (!hw.$('hw-stylesheet-create').styleSheet) {
    var createRules = hw.$('hw-stylesheet-create').sheet.cssRules;
    for (var x = 0; x < createRules.length; ++x) {
      cssContent += createRules[x].cssText;
    }
  } else {
    cssContent += hw.$('hw-stylesheet-create').styleSheet.cssText;  // workaround ie < 9
  }
  hw.stylesheetCache = cssContent;
  return cssContent;
};

hw.createMediaIframe = function(callback) {
  var mediaList = hw.getFirstElementByName('hw-media-list');

  hw.hideElementOptions();

  if (mediaList.childNodes.length
      && hw.getFirstElementByName('hw-media-remote', mediaList.childNodes[mediaList.childNodes.length - 1].contentWindow.document)
      && !hw.getFirstElementByName('hw-media-remote', mediaList.childNodes[mediaList.childNodes.length - 1].contentWindow.document).value
      && !hw.getFirstElementByName('hw-media-local', mediaList.childNodes[mediaList.childNodes.length - 1].contentWindow.document).value
      && !hw.getFirstElementByName('hw-media-file', mediaList.childNodes[mediaList.childNodes.length - 1].contentWindow.document).value) {
    return;
  }

  var createForm = hw.getFirstElementByName('hw-create');
  hw.setClass(createForm, 'hw-media', true);
  var iframe = document.createElement('iframe');
  var child = mediaList.appendChild(iframe);
  iframe.src = 'about:blank';
  iframe.setAttribute('name', 'hw-media-creator');
  iframe.setAttribute('width', '100%');
  iframe.setAttribute('height', '88');
  iframe.setAttribute('class', 'hw-slide-transition');

  var fn = function() {
    var cssContent = hw.stylesheetCache ? hw.stylesheetCache : hw.generateStylesheetCache();
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    if (styleElement.styleSheet) {
      styleElement.styleSheet.cssText = cssContent;
    } else {
      styleElement.appendChild(document.createTextNode(cssContent));
    }
    iframe.contentWindow.document.getElementsByTagName('head')[0].appendChild(styleElement);

    if (hw.isIE) {
      var scriptElement = document.createElement('script');
      scriptElement.src = 'http://html5shiv.googlecode.com/svn/trunk/html5.js';
      iframe.contentWindow.document.getElementsByTagName('head')[0].appendChild(scriptElement);
    }

    var body = iframe.contentWindow.document.body;
    body.innerHTML = '<form id="form" method="post" action="' + hw.uploadUrl + '" enctype="multipart/form-data" name="hw-create">'
        + hw.xsrf
        + hw.getFirstElementByName('hw-media-creator-template').innerHTML
        + '</form>';

    Event.observe(hw.getFirstElementByName('hw-create', iframe.contentWindow.document), 'dragenter', hw.dragenter, false);
    Event.observe(hw.getFirstElementByName('hw-create', iframe.contentWindow.document), 'dragleave', hw.dragleave, false);
    Event.observe(hw.getFirstElementByName('hw-create', iframe.contentWindow.document), 'dragover', hw.dragover, false);
    Event.observe(hw.getFirstElementByName('hw-create', iframe.contentWindow.document), 'drop', hw.drop, false);

    Event.stopObserving(iframe, 'load', fn, false);
    hw.workaroundPlaceholder(null, iframe.contentWindow.document);

    if (callback) {
      //var cb = function() {
        callback(iframe.contentWindow.document);
      //};
      //setTimeout(cb, 0);
    }
  };
  Event.observe(iframe, 'load', fn, false);
};

hw.dragenter = function(event) {
  hw.preventDefault(event);

  if (event.target && event.target.nodeName != "#text") {
    hw.addClass(event.target, 'hw-drag');
  }
};

hw.dragleave = function(event) {
  hw.preventDefault(event);

  if (event.target && event.target.nodeName != "#text") {
    hw.removeClass(event.target, 'hw-drag');
  }
};

hw.dragover = function(event) {
  hw.preventDefault(event);
};

hw.drop = function(event) {
  hw.preventDefault(event);

  var dt = event.dataTransfer;
  var files = dt.files;
  var el = event.target;
  for (var x = 0; x < files.length; ++x) {
    var file = files[x];
    var last = x == files.length - 1;
    var callback = hw.localMediaHelper(file, last);
    if (x > 0) {
      hw.createMediaIframe(callback);
    } else {
      callback(el.ownerDocument);
    }
  }
};

// from quirksmode.org

hw.getEventPos = function(event) {
  var posx = 0;
  var posy = 0;
  if (!event) event = window.event;
  if (event.pageX || event.pageY) {
    posx = event.pageX;
    posy = event.pageY;
  } else if (event.clientX || event.clientY) {
    posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    posy = event.clientY + document.body.scrollTop  + document.documentElement.scrollTop;
  }

  return [posx, posy];
}

hw.dragEl = null;
hw.dragOffsetX = 0;
hw.dragOffsetY = 0;
hw.dragMouseX = 0;
hw.dragMouseY = 0;
hw.dragElementStart = function(event, el) {
  hw.dragEl = el;

  hw.dragOffsetX = parseInt(hw.dragEl.parentNode.style.left);
  hw.dragOffsetY = parseInt(hw.dragEl.parentNode.style.top);

  var pos = hw.getEventPos(event);
  hw.dragMouseX = pos[0];
  hw.dragMouseY = pos[1];
};
hw.dragMouseMove = function(event) {
  if (hw.dragEl) {
    var pos = hw.getEventPos(event);
    hw.dragEl.parentNode.style.left = (hw.dragOffsetX + pos[0] - hw.dragMouseX) + 'px';
    hw.dragEl.parentNode.style.top  = (hw.dragOffsetY + pos[1] - hw.dragMouseY) + 'px';
    if (document.selection) {
      document.selection.empty();
    } else {
      window.getSelection().removeAllRanges();
    }
  }
}
hw.dragMouseUp = function(event) {
  hw.dragEl = null;
}
Event.observe(document, 'mousemove', hw.dragMouseMove, false);
Event.observe(document, 'mouseup', hw.dragMouseUp, false);


hw.remoteMedia = function(el) {
  hw.newMedia(el.ownerDocument, true);
  hw.createMediaIframe();
};

hw.checkPaste = function(el, event) {
  var key = event.which ? event.which : event.keyCode;

  switch (key) {
    case 118:   // ctrl-v, paste
      if (hw.testAccelKey(event)) {
        var fn = function() {
          hw.remoteMedia(el, true);
        };
        setTimeout(fn, 0);
        break;
      }
  }
};

// TODO combine with hw.drop
hw.localMedia = function(el) {
  if (el.files) {
    for (var x = 0; x < el.files.length; ++x) {
      var file = el.files[x];
      var last = x == el.files.length - 1;
      var callback = hw.localMediaHelper(file, last);
      if (x > 0) {
        hw.createMediaIframe(callback);
      } else {
        callback(el.ownerDocument);
      }
    }
  } else {
    hw.newMedia(el.ownerDocument, false);
    hw.createMediaIframe();
  }
};
hw.localMediaHelper = function(file, last) {
  return function(iframeDocument) {
    hw.newMedia(iframeDocument, false, file);
    if (last) {
      hw.createMediaIframe();
    }
  };
};

hw.cancelMedia = function(el) {
  var mediaList = hw.getFirstElementByName('hw-media-list');

  for (var x = 0; x < mediaList.childNodes.length; ++x) {
    if (mediaList.childNodes[x].contentWindow.document == el.ownerDocument) {
      mediaList.removeChild(mediaList.childNodes[x]);
      break;
    }
  }

  hw.createMediaIframe();
};

hw.mediaLibrary = function(event, el, close) {
  if (event) {
    hw.preventDefault(event);
  }

  if (!close) {
    hw.html(null, null, true);
  }

  var media = hw.getFirstElementByName('hw-wysi-media');
  var mediaWrapper = hw.getFirstElementByName('hw-media-wrapper');
  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');
  var createForm = hw.getFirstElementByName('hw-create');
  var openMedia = close ? false : hw.isHidden(mediaWrapper);
  hw.setClass(media, 'hw-selected', openMedia);
  hw.setClass(wysiwyg, 'hw-media-library', openMedia);
  hw.setClass(createForm, 'hw-media-library', openMedia);
  hw.display(mediaWrapper, openMedia);
  var fn = function() { hw.createOnScroll(); }
  setTimeout(fn, 300);
  hw.hideElementOptions();

  if (mediaWrapper.src == 'about:blank' && !close) {
    mediaWrapper.src = hw.baseUri() + 'media?embedded=true';
  }
  return;

  // old code
  if (!hw.getFirstElementByName('hw-file-list') && !close) {
    mediaWrapper.innerHTML = mediaWrapper.getAttribute('data-loading'); 

    var callback = function(xhr) {
      mediaWrapper.innerHTML = xhr.responseText;
    };

    var badTrip = function(xhr) {
      mediaWrapper.innerHTML = mediaWrapper.getAttribute('data-bad'); 
    };

    new hw.ajax(hw.baseUri() + 'media',
      { method: 'get',
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: callback,
        onError: badTrip });
  }
};

hw.mediaEmbedded = false;
hw.mediaStandalone = false;
// todo, all this should be refactored into a nice class and such
hw.mediaSelect = function(event, selectEl, opt_mediaValue) {
  if (!selectEl && opt_mediaValue && hw.mediaStandalone) {
    parent.opener.hw.selectFileFinish(opt_mediaValue);
    window.close();
    return;
  }

  var uploadedMedia = null;
  if (!selectEl && opt_mediaValue && hw.mediaEmbedded) {
    var fileList = hw.getFirstElementByName('hw-file-list');
    var selectElements = fileList.getElementsByTagName('select');
    var found = false;
    for (var x = 0; x < selectElements.length; ++x) {
      hw.hide(selectElements[x]);
      if (!found) {
        for (var y = 0; y < selectElements[x].options.length; ++y) {
          if (selectElements[x].options[y].value == opt_mediaValue) {
            selectEl = selectElements[x];
            selectElements[x].options[y].selected = true;
            uploadedMedia = selectElements[x].options[y];
            hw.show(selectElements[x]);
            found = true;
          }
        }
      }
    }
  }

  if (!selectEl) {
    if (hw.mediaEmbedded && event) {
      hw.preventDefault(event);
    }

    selectEl = hw.mediaGetCurrentSelectElement();
  }

  var media = uploadedMedia || selectEl.options[selectEl.selectedIndex];

  if (media.hasAttribute('data-directory')) {
    hw.getFirstElementByName('hw-media-directory').value = media.value;
    hw.show(hw.getFirstElementByName('hw-files-' + media.value.replace(/\//g, '-')));
    hw.hide(selectEl);
  } else if (hw.mediaStandalone) {
    parent.opener.hw.selectFileFinish(media.value);
    window.close();
  } else {
    var allMedia = [];
    for (var x = selectEl.options.length - 1; x >= 0; --x) {
      if (selectEl.options[x].selected) {
        allMedia.push(selectEl.options[x]);
      }
    }

    var insertAsSlideshow = false;
    var slideshowHTML = "";
    if (allMedia.length > 1 && window.confirm(hw.getMsg('insert-as-slideshow'))) {
      insertAsSlideshow = true;
    }

    hw.mediaSelectHelper(allMedia, 0, insertAsSlideshow, slideshowHTML);
  }
};

hw.mediaGetCurrentSelectElement = function() {
  var fileList = hw.getFirstElementByName('hw-file-list');
  var selectElements = fileList.getElementsByTagName('select');
  for (var x = 0; x < selectElements.length; ++x) {
    if (!hw.isHidden(selectElements[x])) {
      return selectElements[x];
    }
  }
};

hw.mediaSelectHelper = function(allMedia, position, insertAsSlideshow, slideshowHTML) {
  if (position >= allMedia.length) {
    if (insertAsSlideshow) {
      slideshowHTML =
          '<div class="hw-media-slideshow">'
        +   '<span class="hw-media-slideshow-control" onclick="hw.mediaSlideshow(this, -1)">&nbsp;&larr;&nbsp;</span>'
        +   '<span class="hw-media-slideshow-label"> ' + hw.getMsg('slideshow') + ' </span>'
        +   '<span class="hw-media-slideshow-control" onclick="hw.mediaSlideshow(this, 1)">&nbsp;&rarr;&nbsp;</span>'
        +   slideshowHTML
        + '</div>';
      parent.hw.insertHtmlAtCursor(slideshowHTML + '<br><br>');
    }
    return;
  }

  var media = allMedia[position];

  var callback = function(xhr, cached) {
    var mediaHTML = cached || xhr.responseText;
    if (insertAsSlideshow) {
      slideshowHTML = '<div class="hw-media-slideshow-item '
          + (position == allMedia.length - 1 ? 'hw-open' : 'hw-closed')
          + '" onclick="hw.mediaSlideshow(this, 1)">'
          + mediaHTML
          + "</div>"
          + slideshowHTML;
    } else {
      parent.hw.insertHtmlAtCursor(mediaHTML + '<br><br>');
    }
    parent.hw.htmlPreview();
    hw.mediaSelectHelper(allMedia, position + 1, insertAsSlideshow, slideshowHTML);
  };
  if (media.getAttribute('data-html')) {
    callback(null, media.getAttribute('data-html'));
  } else {
    hw.mediaHTML(media.value, callback);
  }
};

hw.mediaPreview = function(selectEl) {
  var media = selectEl.options[selectEl.selectedIndex];
  if (media.hasAttribute('data-directory')) {
    return;
  }

  var callback = function(xhr) {
    media.setAttribute('data-html', xhr.responseText);
    hw.getFirstElementByName('hw-preview').innerHTML = xhr.responseText;
  };

  hw.mediaHTML(media.value, callback);
};

hw.mediaUpload = function(form) {
  var progress = hw.getFirstElementByName('hw-media-file-progress');
  hw.removeClass(progress, 'hw-hidden');
  hw.addClass(hw.getFirstElementByName('hw-media-file-failed'), 'hw-hidden');

  var transferProgress = function(e) {
    if (e.lengthComputable) {
      var percentage = Math.round((e.loaded * 100) / e.total);
      progress.setAttribute('value', percentage);
      progress.innerHTML = percentage + '%';
    }        
  };

  var onSuccess = function(xhr) {
    window.location.href = window.location.href + '&uploaded_file=' + encodeURIComponent(form["hw-media-directory"].value);
  };

  var transferError = function(e) {
    hw.removeClass(hw.getFirstElementByName('hw-media-file-failed'), 'hw-hidden');
    hw.addClass(progress, 'hw-hidden');
  };

  var formData = new FormData(form);

  var uploadRequest = new hw.ajax(window.location.href,
    { upload: formData,
      onProgress: transferProgress,
      onSuccess: onSuccess,
      onError: transferError });

  if (!uploadRequest.transport.upload) {
    progress.setAttribute('max', '');
    form.submit();
  }
};

hw.mediaDelete = function(event, form) {
  if (hw.mediaEmbedded && event) {
    hw.preventDefault(event);
  }

  if (!window.confirm(hw.getMsg('confirm-delete'))) {
    return;
  }

  var selectEl = hw.mediaGetCurrentSelectElement();

  var allMedia = [];
  for (var x = selectEl.options.length - 1; x >= 0; --x) {
    if (selectEl.options[x].selected) {
      allMedia.push(selectEl.options[x].value);
    }
  }

  if (!allMedia.length) {
    return;
  }

  var callback = function(xhr) {
    window.location.href = window.location.href + '&uploaded_file=' + encodeURIComponent(form["hw-media-directory"].value);
  };

  var createForm = hw.getFirstElementByName('hw-create');
  new hw.ajax(hw.baseUri() + 'media',
      { method: 'delete',
        postBody: 'files=' + encodeURIComponent(JSON.stringify(allMedia)),
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: callback });
};

hw.mediaHTML = function(media, callback) {
  var createForm = hw.getFirstElementByName('hw-create');
  new hw.ajax(hw.baseUri() + 'media?preview=' + encodeURIComponent(media),
      { method: 'get',
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: callback });
};

hw.insertHtmlAtCursor = function(html) {
  hw.getFirstElementByName('hw-wysiwyg').focus();

  hw.changeBeforeUnloadState(null);

  var range, node;
  if (window.getSelection && window.getSelection().getRangeAt) {
    range = window.getSelection().getRangeAt(0);
    node = range.createContextualFragment(html);
    range.insertNode(node);
  } else if (document.selection && document.selection.createRange) {
    document.selection.createRange().pasteHTML(html);
  }
};

hw.dragChromeWorkaroundId = null; // XXX bite me Chrome, why can't you getData in dragOver and dragLeave??
hw.dragStart = function(event, el) {
  event.dataTransfer.setData('text/plain', el.id);
  hw.dragChromeWorkaroundId = el.id;

  var dragInfo = hw.dragLogic(event, el);
  if (!dragInfo['dragAllowed']) {
    return;
  }

  event.dataTransfer.effectAllowed = 'move';
};

hw.dragLogic = function(event, el) {
  var dragAllowed = true;

  // if not editing, disable
  if (hw.$('hw-container') && !hw.hasClass('hw-container', 'hw-editing')) {
    return { 'dragAllowed': false };
  }

  // if renaming, disable as well
  if (hw.hasClass(el, 'hw-renaming')) {
    return { 'dragAllowed': false };
  }

  var id = event.dataTransfer.getData('text/plain') || hw.dragChromeWorkaroundId; // XXX see chrome comment above :-/
  var draggedElement = hw.$(id);

  // if renaming, disable as well
  if (hw.hasClass(draggedElement, 'hw-renaming')) {
    return { 'dragAllowed': false };
  }

  var draggedIsSitemap = id.indexOf('hw-sitemap') == 0;
  var dropIsSitemap = el.id.indexOf('hw-sitemap') == 0;

  var draggedIsAlbum = draggedIsSitemap && id.indexOf('|', 11) != -1;
  var dropIsAlbum = dropIsSitemap && el.id.indexOf('|', 11) != -1;

  var draggedNextSibling = hw.nextSiblingNonText(draggedElement);
  var draggedHasAlbum = draggedIsSitemap && draggedNextSibling && draggedNextSibling.firstChild && draggedNextSibling.firstChild.nodeName == 'UL';
  var draggedAlbum;
  if (draggedHasAlbum) {
    draggedAlbum = draggedNextSibling;
  }
  var dropNextSibling = hw.nextSiblingNonText(el);
  var dropHasAlbum = dropIsSitemap && dropNextSibling && dropNextSibling.firstChild && dropNextSibling.firstChild.nodeName == 'UL';
  var dropAlbum;
  if (dropHasAlbum) {
    dropAlbum = dropNextSibling;
  }

  if (draggedElement.getAttribute('data-is-album') == 'true' && dropIsSitemap) {
    return { 'dragAllowed': false };
  }

  return { 'dragAllowed': dragAllowed,
           'id': id,
           'dropped_id': el.id,
           'draggedIsSitemap': draggedIsSitemap,
           'dropIsSitemap': dropIsSitemap,
           'draggedElement': draggedElement,
           'draggedIsAlbum': draggedIsAlbum,
           'dropIsAlbum': dropIsAlbum,
           'draggedAlbum': draggedAlbum,
           'dropAlbum': dropAlbum };
};

hw.dragOver = function(event, el, album) {
  var dragInfo = hw.dragLogic(event, el);

  if (!dragInfo['dragAllowed']) {
    return;
  }

  // cannot drag top level section into an album
  if (dragInfo['draggedIsSitemap'] && album && !dragInfo['draggedIsAlbum']) {
    return;
  }

  // cannot drag onto itself
  if (el.id == dragInfo['id']) {
    return;
  }

  hw.preventDefault(event);

  if (!dragInfo['draggedIsSitemap']) {
    hw.addClass(el, 'hw-over-content');
  } else if (!dragInfo['draggedIsAlbum'] && dragInfo['dropAlbum']) {
    hw.addClass(hw.nextSiblingNonText(el), 'hw-over');
  } else {
    hw.addClass(el, 'hw-over');
  }
};

hw.dragLeave = function(event, el) {
  var dragInfo = hw.dragLogic(event, el);

  if (!dragInfo['dragAllowed']) {
    return;
  }

  if (!dragInfo['draggedIsSitemap']) {
    hw.removeClass(el, 'hw-over-content');
  } else if (!dragInfo['draggedIsAlbum'] && dragInfo['dropAlbum']) {
    hw.removeClass(hw.nextSiblingNonText(el), 'hw-over');
  } else {
    hw.removeClass(el, 'hw-over');
  }
};

hw.dragDrop = function(event, el) {
  hw.preventDefault(event);

  var dragInfo = hw.dragLogic(event, el);

  if (!dragInfo['dragAllowed']) {
    return;
  }

  var draggedElement = dragInfo['draggedElement'];

  var newSection = dragInfo['draggedIsSitemap'] && el.id.split('|')[1] != draggedElement.id.split('|')[1] ? el.id.split('|')[1] : '';

  draggedElement = draggedElement.parentNode.removeChild(draggedElement);

  var insertedElement;

  if (!dragInfo['draggedIsSitemap']) {
    hw.removeClass(el, 'hw-over-content');
    if (!dragInfo['dropIsSitemap']) {
      insertedElement = el.parentNode.insertBefore(draggedElement, el.nextSibling);
    }
  } else if (dragInfo['draggedIsAlbum']) {
    hw.removeClass(el, 'hw-over');

    if (!dragInfo['dropIsAlbum'] && !dragInfo['dropAlbum']) {
      var li = document.createElement('LI');
      var ul = document.createElement('UL');
      li.appendChild(ul);
      dragInfo['dropAlbum'] = el.parentNode.insertBefore(li, el.nextSibling);
    }

    if (dragInfo['dropIsAlbum']) {
      insertedElement = el.parentNode.insertBefore(draggedElement, el.nextSibling);
    } else {
      insertedElement = dragInfo['dropAlbum'].firstChild.insertBefore(draggedElement, dragInfo['dropAlbum'].firstChild.firstChild);
    }
  } else {
    hw.removeClass(dragInfo['dropAlbum'] ? hw.nextSiblingNonText(el) : el, 'hw-over');
    var insertBeforeElement = dragInfo['dropAlbum'] ? hw.nextSiblingNonText(el).nextSibling : el.nextSibling;
    var albumElement;
    if (dragInfo['draggedAlbum']) {
      albumElement = el.parentNode.insertBefore(dragInfo['draggedAlbum'], insertBeforeElement);
    }
    insertBeforeElement = albumElement ? albumElement : insertBeforeElement;
    insertedElement = el.parentNode.insertBefore(draggedElement, insertBeforeElement);
  }

  var position = 0;
  if ((!dragInfo['dropIsSitemap'] && !dragInfo['draggedIsSitemap']) || dragInfo['draggedIsAlbum']) {
    var albumEl = insertedElement.parentNode.firstChild;
    while (albumEl) {
      if (albumEl.nodeName != "LI") {
        albumEl = albumEl.nextSibling;
        continue;
      }
      if (albumEl.id == insertedElement.id) {
        break;
      }
      ++position;
      albumEl = albumEl.nextSibling;
    }
  } else if (dragInfo['draggedIsSitemap']) {
    var sectionEl = insertedElement.parentNode.firstChild;
    while (sectionEl) {
      if (sectionEl.nodeName != "LI" || !sectionEl.getAttribute('draggable')) {
        sectionEl = sectionEl.nextSibling;
        continue;
      }
      if (sectionEl.id == insertedElement.id) {
        break;
      }
      ++position;
      sectionEl = sectionEl.nextSibling;
    }
  }

  var sectionAlbum = hw.getFirstElementByName('hw-section').value + '|' + hw.getFirstElementByName('hw-name').value;

  var createForm = hw.getFirstElementByName('hw-create');
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='       + encodeURIComponent('order')
             + '&type='     + encodeURIComponent(!dragInfo['draggedIsSitemap'] ? 'content'
                                                 : (dragInfo['draggedIsAlbum'] ? 'album' : 'section'))
             + '&dragged='  + encodeURIComponent(dragInfo['id'])
             + '&dropped='  + encodeURIComponent(dragInfo['dropped_id'])
             + '&current_section_album='  + encodeURIComponent(sectionAlbum)
             + '&position=' + encodeURIComponent(position)
             + '&new_section=' + encodeURIComponent(newSection),
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value } });
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
    var createForm = hw.getFirstElementByName('hw-create');
    var newName = hw.cleanName(el.textContent);
    el.href = el.href.substring(0, el.href.lastIndexOf('/')) + '/' + newName;
    el.setAttribute('data-original', el.textContent);
    var oldId = el.parentNode.id;
    el.parentNode.id = el.parentNode.id.substring(0, el.parentNode.id.lastIndexOf('|')) + '|' + newName;

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

hw.createOnScroll = function(event) {
  var text = hw.getFirstElementByName('hw-wysiwyg-controls');
  var makeTextFixed = hw.getFirstElementByName('hw-wysiwyg').getBoundingClientRect().top - text.getBoundingClientRect().height < 0
               && text.getBoundingClientRect().height < hw.getFirstElementByName('hw-view').getBoundingClientRect().bottom;
  hw.setClass(text, 'hw-fixed', makeTextFixed);
  /*var marginTop = 0;
  if (makeFixed) {
    marginTop = (hw.getFirstElementByName('hw-text').getBoundingClientRect().height - 2) + 'px';
  }
  hw.getFirstElementByName('hw-wysiwyg').style.marginTop = marginTop;*/
  hw.setClass(hw.$('hw-container'), 'hw-fixed', makeTextFixed);
};

hw.changeThumbPreview = function() {
  var thumb = hw.getFirstElementByName('hw-thumb');
  var thumbPreview = hw.getFirstElementByName('hw-thumb-preview');
  if (!thumbPreview) {
    return;
  }
  hw.display(thumbPreview, thumb.value);
  if (thumb.value) {
    thumbPreview.src = thumb.value;
  }
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
    window.location.reload();
  };

  var badTrip = function(xhr) {
    button.disabled = false;
    button.innerHTML = button.getAttribute('data-normal');
    alert(hw.$('hw-following-new').getAttribute('data-error'));
  };

  var createForm = hw.getFirstElementByName('hw-create');
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

  var createForm = hw.getFirstElementByName('hw-create');
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

  var createForm = hw.getFirstElementByName('hw-create');
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

  var createForm = hw.getFirstElementByName('hw-create');
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
  var commentForm = hw.getFirstElementByName('hw-comment-form');

  if (commentForm) {
    if (document.body.parentNode.scrollTop) {
      document.body.parentNode.scrollTop = commentForm.getBoundingClientRect().top - 100;
    } else {
      document.body.scrollTop = commentForm.getBoundingClientRect().top - 100;
    }

    var input = hw.getFirstElementByName('hw-comment-input');
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
    document.body.parentNode.scrollTop = hw.getFirstElementByName('hw-wysiwyg').getBoundingClientRect().top - 100;
  } else {
    document.body.scrollTop = hw.getFirstElementByName('hw-wysiwyg').getBoundingClientRect().top - 100;
  }

  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');
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

  hw.getFirstElementByName('hw-thread').value = el.parentNode.getAttribute('data-post-id');
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

  var createForm = hw.getFirstElementByName('hw-create');
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

  var createForm = hw.getFirstElementByName('hw-create');
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
}
