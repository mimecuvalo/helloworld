hw.prepareFilesAndSendOff = function(callback) {
  
};

hw.processFiles = function(json) {
  var createForm = hw.$c('hw-create');
  hw.insertHtmlAtCursor(json['html']);
  hw.htmlPreview();

  if (json['thumb_url'] && !createForm['hw-thumb'].value) {
    createForm['hw-thumb'].value = json['thumb_url'];
    hw.changeThumbPreview();
  }
};

/*
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
*/

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
  hw.setClass(hw.$('hw-container'), 'hw-media-library-open', openMedia);
  hw.display(mediaWrapper, openMedia);
  var fn = function() { hw.createOnScroll(); };
  setTimeout(fn, 300);
  hw.hideElementOptions();

  if (mediaWrapper.src == 'about:blank' && !close) {
    mediaWrapper.src = hw.baseUri() + 'media?embedded=true';
  }
};

hw.mediaEmbedded = false;
hw.mediaStandalone = false;
// todo, all this should be refactored into a nice class and such
hw.mediaSelect = function(event, selectEl, opt_mediaValue) {
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
    hw.$$('[name=hw-button-media]')[0].setAttribute('data-section', media.value);
    hw.show(hw.$$('[name=hw-files-' + media.value.replace(/\//g, '-') + ']')[0]);
    hw.hide(selectEl);
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

hw.uploadButton = function(callback, section) {
  section = section || "";
  document.write('<a name="hw-button-media" class="hw-button hw-button-media" data-section="' + section + '">+</a>'
               + '<progress value="0" max="100" class="hw-hidden">0%</progress>'
               + '<span class="hw-media-result hw-hidden"></span>');
  var buttons = hw.$$('.hw-button-media');
  var button = buttons[buttons.length - 1];
  var progress = button.nextSibling;
  var result = progress.nextSibling;
  var xsrf = hw.$$('input[name=_xsrf]')[0].value;

  var r = new Resumable({
    target: hw.uploadUrl, 
    query: { 'section': encodeURIComponent(section),
             '_xsrf' : encodeURIComponent(xsrf) }
  });

  // Resumable.js isn't supported, fall back on a different method
  if (!r.support) {
    var iframe = document.createElement('iframe');
    var child = button.parentNode.appendChild(iframe);
    iframe.src = 'about:blank';
    iframe.setAttribute('name', 'hw-media-creator');
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '16');
    iframe.setAttribute('class', 'hw-hidden');

    var onUpload = function() {
      Event.stopObserving(iframe, 'load', onUpload, false);

      var doc = iframe.contentWindow.document;
      var body = doc.body;

      var bad = false;
      var json;
      try {
        json = JSON.parse(body.innerHTML);
      } catch(ex) {
        bad = true;
      }

      if (bad) {
        result.innerHTML = hw.getMsg('error');
        hw.show(result);
      } else {
        result.innerHTML = hw.getMsg('saved');
        hw.show(result);
        callback(json);
      }

      fn();
    };

    var fn = function() {
      var doc = iframe.contentWindow.document;
      var body = doc.body;
      body.innerHTML = '<form id="form" method="post" action="' + hw.uploadUrl + '" enctype="multipart/form-data">'
          + hw.xsrf
          + '<input id="section" type="hidden" name="section" value="' + section + '">'
          + '<input id="file" name="file" type="file" multiple="multiple" onchange="this.form.submit()">'
          + '</form>';

      Event.stopObserving(iframe, 'load', fn, false);
      Event.observe(iframe, 'load', onUpload, false);

      hw.hide(result);
      result.innerHTML = "";

      button.onclick = function() {
        doc.getElementById('section').value = button.getAttribute('data-section');
        doc.getElementById('file').click();
      }
    };
    Event.observe(iframe, 'load', fn, false);

    return;
  }

  r.assignBrowse(button);

  var resumableObj = null;

  r.on('fileAdded', function(file) {
    resumableObj = file.resumableObj;
    resumableObj.opts.query['section'] = button.getAttribute('data-section');
    file.resumableObj.upload();
    hw.show(progress);
    hw.hide(button);
    hw.hide(result);
    result.innerHTML = "";
  });
  r.on('fileSuccess', function(file, msg) {
    var json = JSON.parse(msg);
    callback(json);
  });

  r.on('complete', function() {
    resumableObj.files = [];
    hw.show(button);
    hw.hide(progress);
    progress.setAttribute('value', '0');
    progress.innerHTML = '0%';
    result.innerHTML = hw.getMsg('saved');
    hw.show(result);
  });
  r.on('error', function(message, file) {
    resumableObj.files = [];
    hw.show(button);
    hw.hide(progress);
    progress.setAttribute('value', '0');
    progress.innerHTML = '0%';
    result.innerHTML = hw.getMsg('error');
    hw.show(result);
  });
  r.on('progress', function() {
    if (!resumableObj) {
      return;
    }

    var percent = resumableObj.progress() * 100;
    progress.setAttribute('value', percent);
    progress.innerHTML = percent + '%';
  });
};
