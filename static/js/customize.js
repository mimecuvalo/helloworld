hw.setupFields = false;
hw.currentColorPickerEl = null;
hw.customSetupFields = function() {
  if (hw.setupFields) {
    return;
  }
  hw.setupFields = true;

  var fields = hw.$$('.hw-field');
  for (var x = 0; x < fields.length; ++x) {
    Event.observe(fields[x], 'focus', function() { hw.customChangeBeforeUnloadState(); }, false);
  }

  hw.setupColorPicker(function(color) {
    hw.currentColorPickerEl.style.backgroundColor = color;
  });
  hw.customAppearance();
};

hw.customChangeBeforeUnloadState = function(allowPageChange) {
  window.onbeforeunload = allowPageChange ? null : function() { return "" };
};

hw.customResetSaveState = function() {
  var customForm = hw.$c('hw-customize');
  var response = hw.$c('hw-response');
  var saveButton = hw.$('hw-customize-save');

  hw.displayResponse(true, response.getAttribute('data-saved'));
  saveButton.value = saveButton.getAttribute('data-save');
  saveButton.disabled = false;

  hw.customChangeBeforeUnloadState(true);
};

hw.customSave = function(event, el) {
  hw.preventDefault(event);
  var customForm = hw.$('hw-customize');
  var response   = hw.$c('hw-response');
  var saveButton = hw.$('hw-customize-save');

  var callback = function(xhr) {
    hw.customResetSaveState();
  };

  var badTrip = function(xhr) {
    saveButton.value = saveButton.getAttribute('data-save');
    saveButton.disabled = false;
    hw.displayResponse(false, response.getAttribute('data-bad'));
  };

  saveButton.value = saveButton.getAttribute('data-saving');
  saveButton.disabled = true;

  new hw.ajax(hw.baseUri() + 'customize',
    { method: 'post',
      postBody: 'title='               + encodeURIComponent(customForm['title'].value)
             + '&description='         + encodeURIComponent(customForm['description'].value)
             + '&oauth='               + encodeURIComponent(customForm['oauth'].value)
             + '&name='                + encodeURIComponent(customForm['name'].value)
             + '&favicon='             + encodeURIComponent(customForm['favicon'].value)
             + '&currency='            + encodeURIComponent(customForm['currency'].value)
             + '&theme='               + encodeURIComponent(customForm['theme'].value)
             + '&theme_title='         + encodeURIComponent(customForm['theme_title'].value)
             + '&theme_link='          + encodeURIComponent(customForm['theme_link'].value)
             + '&theme_author='        + encodeURIComponent(customForm['theme_author'].value)
             + '&theme_author_link='   + encodeURIComponent(customForm['theme_author_link'].value)
             + '&extra_head_html='     + encodeURIComponent(customForm['extra_head_html'].value)
             + '&extra_body_end_html=' + encodeURIComponent(customForm['extra_body_end_html'].value)
             + '&logo='                + encodeURIComponent(customForm['logo'].value)
             + '&google_analytics='    + encodeURIComponent(customForm['google_analytics'].value)
             + '&adult_content='       + encodeURIComponent(customForm['adult_content'].checked ? 1 : 0)
             + '&tipjar='              + encodeURIComponent(customForm['tipjar'].value)
             + '&sidebar_ad='          + encodeURIComponent(customForm['sidebar_ad'].value)
             + '&newsletter_endpoint=' + encodeURIComponent(customForm['newsletter_endpoint'].value)
             + '&license='             + encodeURIComponent(customForm['license'].value),
      headers: { 'X-Xsrftoken' : customForm['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.deleteAccount = function(event, username) {
  hw.preventDefault(event);

  if (!window.confirm(hw.getMsg('confirm-delete'))) {
    return;
  }

  var callback = function(xhr) {
    window.location.href = hw.baseUri();
  };

  var badTrip = function(xhr) {
    alert(hw.getMsg('delete-failed'));
  };

  new hw.ajax(hw.baseUri() + 'users/' + username,
    { method: 'delete',
      headers: { 'X-Xsrftoken' : hw.$('hw-customize-form')['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.customSetupIframe = function(iframe) {
  return;
  // turn off for now

  var doc = iframe.contentDocument;
  var body = doc.body;
  var img = doc.createElement('IMG');
  img.src = hw.pixelSrc;
  img.style.height = '100%';
  img.style.width = '100%';
  img.style.position = 'absolute';
  img.style.top = '0';
  img.style.left = '0';
  img.style.right = '0';
  img.style.bottom = '0';
  img.style.zIndex = '1000';
  body.appendChild(img);
};

hw.customizeUpdatePreview = function() {
  setTimeout(function() {
    var iframe = hw.$('hw-customize-preview');
    var doc = iframe.contentDocument;
    var body = doc.body;

    doc.getElementById('hw-main-title').innerHTML = hw.$('hw-title').value;
    doc.getElementById('hw-main-description').innerHTML = hw.$('hw-description').value;

    var logo = doc.getElementById('hw-logo-image');
    if (logo) {
      logo.src = hw.$('hw-customize-logo').value || hw.pixelSrc;
      hw.display(doc.getElementById('hw-logo'), hw.$('hw-customize-logo').value);
    }

    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link'),
    oldLink = document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = hw.$('hw-favicon').value || hw.faviconDefault;
    if (oldLink) {
      head.removeChild(oldLink);
    }
    head.appendChild(link);
  }, 0);
};

hw.customizeClear = function(event, el) {
  hw.preventDefault(event);

  hw.$(el).value = '';
  hw.customizeUpdatePreview();
};

hw.customizeEdit = function(event) {
  hw.preventDefault(event);


};

hw.customizeSelectThemes = function(event, close) {
  if (event) {
    hw.preventDefault(event);
  }

  hw.display('hw-customize-themes', !close);
  hw.display('hw-customize-select-theme-close', !close);
};

hw.customizeSelectTheme = function(el) {
  hw.customizeSelectThemes(null, true);
  hw.hide('hw-customize-themes');
  var customForm = hw.$('hw-customize');

  customForm['theme'].value               = el.getAttribute('data-path');
  customForm['theme_title'].value         = el.getAttribute('data-title');
  customForm['theme_link'].value          = el.getAttribute('data-link');
  customForm['theme_author'].value        = el.getAttribute('data-author');
  customForm['theme_author_link'].value   = el.getAttribute('data-author-link');
  customForm['extra_head_html'].value     = el.getAttribute('data-extra-head-html');
  customForm['extra_body_end_html'].value = el.getAttribute('data-extra-body-end-html');

  hw.$('hw-theme-thumb').src             = el.getAttribute('data-thumb');
  hw.$('hw-theme-title').innerHTML       = el.getAttribute('data-title');
  //hw.$('hw-theme-link').innerHTML        = el.getAttribute('data-link');
  hw.display(hw.$('hw-theme-author'), el.getAttribute('data-author'));
  hw.$('hw-theme-author-name').innerHTML = el.getAttribute('data-author');
  hw.$('hw-theme-author-link').href      = el.getAttribute('data-author-link');

  var theme = hw.customGetCurrentTheme();
  theme.removeAttribute('data-selected');
  el.setAttribute('data-selected', '');

  hw.customAppearance();
};

hw.customGetCurrentTheme = function() {
  var themes = hw.$('hw-customize-themes').getElementsByTagName('IMG');
  for (var x = 0; x < themes.length; ++x) {
    if (themes[x].hasAttribute('data-selected')) {
      return themes[x];
    }
  }
};

hw.customAppearance = function() {
  var theme = hw.customGetCurrentTheme();

  var html = '';
  var counter = 0;
  var option = theme.hasAttribute('data-option-' + counter);
  var uploadButtons = [];

  while (option) {
    var data = theme.getAttribute('data-option-' + counter).split(':');
    html += '<label for="hw-option-' + counter + '">'
         +  '<span class="hw-label">' + data[1] + '</span>';
    if (data.length > 2) {
      for (var x = 3; x < data.length; ++x) {
        data[2] += ':' + data[x];
      }
    }

    if (data[0] == 'color') {
      html += '<div id="hw-option-' + counter + '" class="hw-field hw-color-picker" style="background-color:' + data[2] + '" onclick="hw.colorPicker(event, this)"></div>';
    } else if (data[0] == 'font') {
      html += '<select id="hw-option-' + counter + '" class="hw-field">';
      var fonts = ['Arial', 'Arial Black', 'Baskerville', 'Century Gothic', 'Cooperlate Light',
                   'Courier New', 'Futura', 'Garamond', 'Geneva', 'Georgia', 'Helvetica', 'Helvetica Neue',
                   'Impact', 'Lucida Sans', 'Trebuchet MS', 'Verdana'];
      var found = false;
      for (var x = 0; x < fonts.length; ++x) {
        html += '<option style="font-family:' + fonts[x] + '" ' + (data[2].indexOf(fonts[x]) == 0 ? 'selected' : '') + '>' + fonts[x] + '</option>';
        if (data[2].indexOf(fonts[x])) {
          found = true;
        }
      }
      if (!found) {
        html += '<option style="font-family:' + data[2] + '" selected>' + data[2] + '</option>';
      }
      html += '</select>';
    } else if (data[0] == 'image') {
      html += '<a class="hw-button hw-customize-clear" href="#clear" class="hw-button" onclick="hw.customizeClear(event, \'hw-option-' + counter + '-wrapper\')">' + hw.getMsg('clear') + '</a>';
      html += '<span id="hw-option-' + counter + '-wrapper"></span>';
      uploadButtons.push('hw-option-' + counter + '-wrapper');
    } else if (data[0] == 'if') {
      html += '<input id="hw-option-' + counter + '" class="hw-field" type="checkbox" ' + (data[2] == '1' ? checked="checked" : '') + '>';
    } else if (data[0] == 'text') {
      html += '<input id="hw-option-' + counter + '" class="hw-field" value="' + data[2] + '">';
    }

    html += '</label>';

    ++counter;
    option = theme.hasAttribute('data-option-' + counter);
  }

  hw.$('hw-customize-appearance').innerHTML = html;

  for (var x = 0; x < uploadButtons.length; ++x) {
    hw.uploadButton(function(json) { hw.customChangeBeforeUnloadState(); hw.customizeUpdatePreview(); }, null, false, false, hw.$(uploadButtons[x]));
  }

  hw.customizeUpdatePreview();
};

hw.colorPicker = function(event, el) {
  var colorPicker = hw.$('hw-color-picker-wrapper');
  var pos = hw.getEventPos(event);
  colorPicker.style.top = pos[1] + 'px';
  colorPicker.style.left = (pos[0] + 100) + 'px';
  hw.currentColorPickerEl = el;
  hw.show(colorPicker);
};

// from http://www.html5canvastutorials.com/labs/html5-canvas-color-picker/
// by Eric Rowell
hw.setupColorPicker = function(callback) {
  var imageObj = new Image();
  imageObj.onload = function() {
    var size      = 128;
    var canvas    = hw.$('hw-color-picker');
    var context   = canvas.getContext("2d");
    var mouseDown = false;

    context.drawImage(imageObj, 0, 0, size, size);
    var imageData = context.getImageData(0, 0, size, size);
    var data = imageData.data;

    function getColor(event) {
      var eventPos = hw.getEventPos(event);
      var mousePos = { x: eventPos[0] - canvas.getBoundingClientRect().left,
                       y: eventPos[1] - canvas.getBoundingClientRect().top };

      if (mouseDown && mousePos.x >= 0 && mousePos.y >= 0 && mousePos.x < size && mousePos.y < size) {
        var x = mousePos.x;
        var y = mousePos.y;
        var red = data[((size * y) + x) * 4];
        var green = data[((size * y) + x) * 4 + 1];
        var blue = data[((size * y) + x) * 4 + 2];
        return "rgb(" + red + "," + green + "," + blue + ")";
      }
    }

    canvas.addEventListener("mousedown", function() {
      mouseDown = true;
    }, false);

    canvas.addEventListener("mouseup", function(event) {
      callback(getColor(event));
      mouseDown = false;
    }, false);

    canvas.addEventListener("mousemove", function(event){
      callback(getColor(event));
    }, false);
  };
  imageObj.src = hw.colorPickerImage;
};
