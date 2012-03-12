hw.prepareFilesAndSendOff = function(callback) {
  var mediaList = hw.$c('hw-media-list');
  var createForm = hw.$c('hw-create');
  var eventQueue = [];

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

  if (!callback) {
    callback = function(mediaHTML) {
      var wysiwyg = hw.$c('hw-wysiwyg');
      wysiwyg.focus();
      document.execCommand("insertHTML", false, mediaHTML + "<br><br>");
    };
  }

  hw.processFiles(eventQueue, callback, "");
};

hw.processFiles = function(eventQueue, callback, mediaHTML) {
  var createForm = hw.$c('hw-create');

  if (!eventQueue.length) {
    if (createForm['hw-separate'].checked) {
      hw.resetSaveState();
      hw.resetCreateForm();
    } else {
      callback(mediaHTML);
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
        var separateCallback = function(xhr) {
          hw.addToFeed(xhr.responseText);
          hw.processFiles(eventQueue, callback, mediaHTML);
        };
        callback(mediaHTML, form['hw-media-title'].value, separateCallback);
        mediaHTML = "";
        return;
      }
    }

    hw.processFiles(eventQueue, callback, mediaHTML);
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

hw.mediaClick = function(event) {
  hw.preventDefault(event);

  var mediaList = hw.$c('hw-media-list');
  hw.show(mediaList);
  var createForm = hw.$c('hw-create');
  hw.setClass(createForm, 'hw-media-open', true);
  hw.setClass(hw.$('hw-container'), 'hw-media-open', true);

  for (var x = mediaList.childNodes.length - 1; x >= 0; --x) {
    var iframe = mediaList.childNodes[x];
    hw.removeClass(iframe, 'hw-hidden');
    var iframeDoc = iframe.contentWindow.document;
    var fileBrowse = hw.$c('hw-media-local', iframeDoc);
    fileBrowse.click();
    break;
  }
};

hw.newMedia = function(doc, remote, file) {
  var createForm = hw.$c('hw-create');
  var mediaCreator = hw.$c('hw-media-creator', doc);
  hw.addClass(mediaCreator, 'hw-created');
  hw.setClass(mediaCreator, 'hw-separate', createForm['hw-separate'].checked);

  var oppositeSource = remote ? hw.$c('hw-media-local', doc)
                              : hw.$c('hw-media-remote', doc);
  oppositeSource.value = '';
  hw.addClass(oppositeSource, 'hw-initial');

  if (file) {
    hw.addClass(mediaCreator, 'hw-file');
    var fileInput = hw.$c('hw-media-file', doc);
    hw.removeClass(fileInput, 'hw-hidden');
    fileInput.value = file.name;
    fileInput['file'] = file;
  }

  if (!remote) {
    hw.$c('hw-media-local', doc).removeAttribute('multiple');
  }

  if (remote) {
    hw.newMediaPreview(doc, remote, hw.$c('hw-media-remote', doc).value);
  } else {
    hw.newMediaPreview(doc, remote, file);
  }

  hw.changeBeforeUnloadState();
};

hw.newMediaPreview = function(doc, remote, source) {
  var preview = hw.$c('hw-media-preview', doc);
  var previewWrapper = hw.$c('hw-media-preview-wrapper', doc);
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

hw.stylesheetCache = '';
hw.generateStylesheetCache = function() {
  var cssContent = '';
  var sheets = ['hw-stylesheet', 'hw-stylesheet-create', 'hw-stylesheet-create-theme'];
  for (var x = 0; x < sheets.length; ++x) {
    var sheetElement = hw.$(sheets[x]);
    if (!sheetElement.styleSheet) {
      var rules = sheetElement.sheet.cssRules;
      for (var y = 0; y < rules.length; ++y) {
        cssContent += rules[y].cssText;
      }
    } else {
      cssContent = sheetElement.styleSheet.cssText;    // workaround ie < 9
    }
  }
  hw.stylesheetCache = cssContent;
  return cssContent;
};

hw.createMediaIframe = function(callback) {
  var mediaList = hw.$c('hw-media-list');

  hw.hideElementOptions();

  if (mediaList.childNodes.length
      && hw.$c('hw-media-remote', mediaList.childNodes[mediaList.childNodes.length - 1].contentWindow.document)
      && !hw.$c('hw-media-remote', mediaList.childNodes[mediaList.childNodes.length - 1].contentWindow.document).value
      && !hw.$c('hw-media-local', mediaList.childNodes[mediaList.childNodes.length - 1].contentWindow.document).value
      && !hw.$c('hw-media-file', mediaList.childNodes[mediaList.childNodes.length - 1].contentWindow.document).value) {
    return;
  }

  var createForm = hw.$c('hw-create');
  var iframe = document.createElement('iframe');
  var child = mediaList.appendChild(iframe);
  iframe.src = 'about:blank';
  iframe.setAttribute('name', 'hw-media-creator');
  iframe.setAttribute('width', '100%');
  iframe.setAttribute('height', '88');
  iframe.setAttribute('class', 'hw-media-creator hw-slide-transition hw-hidden');

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
    body.innerHTML = '<form id="form" method="post" action="' + hw.uploadUrl + '" enctype="multipart/form-data" class="hw-create" name="hw-create">'
        + hw.xsrf
        + hw.$c('hw-media-creator-template').innerHTML
        + '</form>';

    Event.observe(hw.$c('hw-create', iframe.contentWindow.document), 'dragenter', hw.dragenter, false);
    Event.observe(hw.$c('hw-create', iframe.contentWindow.document), 'dragleave', hw.dragleave, false);
    Event.observe(hw.$c('hw-create', iframe.contentWindow.document), 'dragover', hw.dragover, false);
    Event.observe(hw.$c('hw-create', iframe.contentWindow.document), 'drop', hw.drop, false);

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
    hw.prepareFilesAndSendOff();
  }
};
hw.localMediaHelper = function(file, last) {
  return function(iframeDocument) {
    hw.newMedia(iframeDocument, false, file);
    if (last) {
      hw.createMediaIframe();
      hw.prepareFilesAndSendOff();
    }
  };
};

hw.cancelMedia = function(el) {
  var mediaList = hw.$c('hw-media-list');

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

  var mediaWrapper = hw.$c('hw-media-wrapper');

  if (!mediaWrapper) {
    return;
  }

  var wysiwyg = hw.$c('hw-wysiwyg');
  var createForm = hw.$c('hw-create');
  var openMedia = close ? false : hw.isHidden(mediaWrapper);
  hw.setClass(createForm, 'hw-media-library-open', openMedia);
  hw.display(mediaWrapper, openMedia);
  var fn = function() { hw.createOnScroll(); };
  setTimeout(fn, 300);
  hw.hideElementOptions();

  if (mediaWrapper.src == 'about:blank' && !close) {
    mediaWrapper.src = hw.baseUri() + 'media?embedded=true';
  }
  return;

  // old code
  if (!hw.$c('hw-file-list') && !close) {
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
    var fileList = hw.$c('hw-file-list');
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
    hw.$$('[name=hw-media-directory]')[0].value = media.value;
    hw.show(hw.$$('[name=hw-files-' + media.value.replace(/\//g, '-') + ']')[0]);
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
  var fileList = hw.$c('hw-file-list');
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
    hw.$c('hw-preview').innerHTML = xhr.responseText;
  };

  hw.mediaHTML(media.value, callback);
};

hw.mediaUpload = function(form) {
  var progress = hw.$c('hw-media-file-progress');
  hw.removeClass(progress, 'hw-hidden');
  hw.addClass(hw.$c('hw-media-file-failed'), 'hw-hidden');

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
    hw.removeClass(hw.$c('hw-media-file-failed'), 'hw-hidden');
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

  var createForm = hw.$c('hw-create');
  new hw.ajax(hw.baseUri() + 'media',
      { method: 'delete',
        postBody: 'files=' + encodeURIComponent(JSON.stringify(allMedia)),
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: callback });
};

hw.mediaHTML = function(media, callback) {
  var createForm = hw.$c('hw-create');
  new hw.ajax(hw.baseUri() + 'media?preview=' + encodeURIComponent(media),
      { method: 'get',
        headers: { 'X-Xsrftoken' : createForm['_xsrf'].value },
        onSuccess: callback });
};

hw.insertHtmlAtCursor = function(html) {
  hw.$c('hw-wysiwyg').focus();

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
