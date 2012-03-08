hw.mediaClick = function(event) {
  hw.preventDefault(event);

  var mediaList = hw.getFirstElementByName('hw-media-list');
  hw.show(mediaList);

  for (var x = mediaList.childNodes.length - 1; x >= 0; --x) {
    var iframe = mediaList.childNodes[x];
    var iframeDoc = iframe.contentWindow.document;
    var fileBrowse = hw.getFirstElementByName('hw-media-local', iframeDoc);
    fileBrowse.click();
    break;
  }
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

  //var media = hw.getFirstElementByName('hw-wysi-media');
  var mediaWrapper = hw.getFirstElementByName('hw-media-wrapper');
  var wysiwyg = hw.getFirstElementByName('hw-wysiwyg');
  var createForm = hw.getFirstElementByName('hw-create');
  var openMedia = close ? false : hw.isHidden(mediaWrapper);
  //hw.setClass(media, 'hw-selected', openMedia);
  hw.setClass(wysiwyg, 'hw-media-library', openMedia);
  hw.setClass(createForm, 'hw-media-library', openMedia);
  hw.display(mediaWrapper, openMedia);
  var fn = function() { hw.createOnScroll(); };
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
