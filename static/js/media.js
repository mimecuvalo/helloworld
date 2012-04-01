hw.prepareFilesAndSendOff = function(callback, figures) {
  figures = figures || hw.$c('hw-wysiwyg').innerHTML.match(/<figure>.*?<\/figure>/ig);

  if (!figures.length) {
    hw.resetSaveState();
    hw.resetCreateForm();
    return;
  }

  var figure = figures.pop();
  var caption = figure.match(/<figcaption>.*?<\/figcaption>/ig);
  var title = caption ? caption[0].replace(/<\/?.*?>/ig, '') : hw.getMsg('untitled');

  var separateCallback = function(xhr) {
    hw.addToFeed(xhr.responseText);
    hw.prepareFilesAndSendOff(callback, figures);
  };
  callback(figure, title, separateCallback);
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

  if (openMedia) {
    if (document.body.parentNode.scrollTop) {
      document.body.parentNode.scrollTop = document.body.parentNode.scrollTop + mediaWrapper.getBoundingClientRect().top - 100;
    } else {
      document.body.scrollTop = document.body.scrollTop + mediaWrapper.getBoundingClientRect().top - 100;
    }
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
      var wysiwyg = parent.hw.$c('hw-wysiwyg');
      wysiwyg.focus();
      parent.hw.insertHTML(slideshowHTML + '<br><br>');
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
      var wysiwyg = parent.hw.$c('hw-wysiwyg');
      wysiwyg.focus();
      parent.hw.insertHTML(mediaHTML + '<br><br>');
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
