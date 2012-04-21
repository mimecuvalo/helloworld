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
    if (!color) {
      return;
    }

    hw.currentColorPickerEl.parentNode.setAttribute('data-value', color);
    hw.currentColorPickerEl.style.backgroundColor = color;
    hw.customizeUpdatePreview();
  });

  hw.customSetupCodeMirror();

  hw.customAppearance(true);
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

  // update defaults, go through the custom options
  var options = hw.$('hw-customize-appearance').getElementsByTagName('LABEL');
  for (var x = 0; x < options.length; ++x) {
    var type = options[x].getAttribute('data-type');
    var name = options[x].getAttribute('data-name');
    var defaultOption = options[x].getAttribute('data-default');
    var currentOption = options[x].getAttribute('data-value');

    var regex = new RegExp(" \\* " + type + ":" + name + ":.*", "ig");
    hw.customDefaultStyleSheet = hw.customDefaultStyleSheet.replace(regex, " * " + type + ":" + name + ":" + currentOption);
    hw.$('hw-theme-editor').value = hw.customDefaultStyleSheet;
    hw.customCm.setValue(hw.customDefaultStyleSheet);
  }

  var customForm = hw.$('hw-customize');
  var extraHead    = /\* extra_head_html: """([\S\s]*?)"""/ig.exec(hw.customCurrentStyleSheet);
  var extraBodyEnd = /\* extra_body_end_html: """([\S\s]*?)"""/ig.exec(hw.customCurrentStyleSheet);
  customForm['extra_head_html'].value     = extraHead ? extraHead[1] : "";
  customForm['extra_body_end_html'].value = extraBodyEnd ? extraBodyEnd[1] : "";

  new hw.ajax(hw.baseUri() + 'customize',
    { method: 'post',
      postBody: 'title='               + encodeURIComponent(customForm['title'].value)
             + '&description='         + encodeURIComponent(customForm['description'].value)
             + '&email='               + encodeURIComponent(customForm['email'].value)
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
             + '&license='             + encodeURIComponent(customForm['license'].value)
             + '&default_stylesheet='  + encodeURIComponent(hw.customDefaultStyleSheet)
             + '&stylesheet='          + encodeURIComponent(hw.customCurrentStyleSheet),
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

hw.customizeUpdatePreview = function(event) {
  if (event) {
    hw.preventDefault(event);
  }

  setTimeout(function() {
    var iframe = hw.$('hw-customize-preview');
    var doc = iframe.contentDocument;
    var head = doc.getElementsByTagName('head')[0];
    var body = doc.body;

    doc.getElementById('hw-main-title').innerHTML = hw.$('hw-title').value;
    doc.getElementById('hw-main-description').innerHTML = hw.$('hw-description').value;

    var logo = doc.getElementById('hw-logo-image');
    if (logo) {
      logo.src = hw.$('hw-customize-logo').value || hw.pixelSrc;
      hw.display(doc.getElementById('hw-logo'), hw.$('hw-customize-logo').value);
    }

    var mainHead = document.getElementsByTagName('head')[0];
    var link = document.createElement('link'),
    oldLink = document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = hw.$('hw-favicon').value || hw.faviconDefault;
    if (oldLink) {
      mainHead.removeChild(oldLink);
    }
    mainHead.appendChild(link);

    if (!hw.customDefaultStyleSheet || !hw.customCurrentStyleSheet) {
      // not ready yet
      setTimeout(hw.customizeUpdatePreview, 1000);
      return;
    }

    // go through the custom options
    var options = hw.$('hw-customize-appearance').getElementsByTagName('LABEL');
    hw.customCurrentStyleSheet = hw.customDefaultStyleSheet;
    for (var x = 0; x < options.length; ++x) {
      var type = options[x].getAttribute('data-type');
      var name = options[x].getAttribute('data-name');
      var defaultOption = options[x].getAttribute('data-default');
      var currentOption = options[x].getAttribute('data-value');

      if (type == 'if') {
        var ifRegex    = new RegExp("{if:" + name + "}([^{]*){/if}", "ig");
        var ifNotRegex = new RegExp("{ifnot:" + name + "}([^{]*){/ifnot}", "ig");
        hw.customCurrentStyleSheet = hw.customCurrentStyleSheet.replace(currentOption == "1" ? ifRegex    : ifNotRegex, "$1");
        hw.customCurrentStyleSheet = hw.customCurrentStyleSheet.replace(currentOption == "1" ? ifNotRegex : ifRegex,    "");
      } else {
        var regex = new RegExp("{" + type + ":" + name + "}", "ig");
        hw.customCurrentStyleSheet = hw.customCurrentStyleSheet.replace(regex, currentOption);
      }
    }

    var theme = doc.getElementById('hw-stylesheet-theme');
    theme.parentNode.removeChild(theme);

    var styleElement = doc.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.id = 'hw-stylesheet-theme';
    if (styleElement.styleSheet) {
      styleElement.styleSheet.cssText = hw.customCurrentStyleSheet;
    } else {
      styleElement.innerHTML = hw.customCurrentStyleSheet;
    }
    head.appendChild(styleElement);
  }, 0);
};

hw.customizeClear = function(event, el) {
  hw.preventDefault(event);

  hw.$(el).value = '';
  hw.$(el).parentNode.setAttribute('data-value', '');
  hw.customizeUpdatePreview();
};

hw.customizeEdit = function(event, close) {
  if (event) {
    hw.preventDefault(event);
  }

  if (!hw.customDefaultStyleSheet || !hw.customCurrentStyleSheet) {
    // not ready yet
    setTimeout(hw.customizeEdit, 1000);
    return;
  }

  hw.customChangeBeforeUnloadState();
  hw.setClass(hw.$('hw-container'), 'editing-theme', !close);

  if (close) {
    hw.customAppearance(false, true);
  }
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

  hw.customDefaultStyleSheet = null;
  hw.customCurrentStyleSheet = null;

  hw.customChangeBeforeUnloadState();
  hw.customAppearance();
};

hw.customDefaultStyleSheet = null;
hw.customCurrentStyleSheet = null;
hw.customGetCurrentTheme = function() {
  var themes = hw.$('hw-customize-themes').getElementsByTagName('IMG');
  for (var x = 0; x < themes.length; ++x) {
    if (themes[x].hasAttribute('data-selected')) {
      var staticUrl = themes[x].getAttribute('data-static-url');

      if (!hw.customDefaultStyleSheet) {
        var callback = function(xhr) {
          hw.customDefaultStyleSheet = xhr.responseText;
          hw.$('hw-theme-editor').value = xhr.responseText;
          hw.customCm.setValue(xhr.responseText);
          if (!themes[x].hasAttribute('data-compiled')) {
            hw.customCurrentStyleSheet = xhr.responseText;
          }
        };
        var badTrip = function() { };

        new hw.ajax(staticUrl + '/' + themes[x].getAttribute('data-path'),
        { method: 'get',
          onSuccess: callback,
          onError: badTrip });

        if (themes[x].hasAttribute('data-compiled')) {
          var currentCallback = function(xhr) {
            hw.customCurrentStyleSheet = xhr.responseText;
          };
          var currentBadTrip = function() { };

          new hw.ajax(staticUrl + '/' + themes[x].getAttribute('data-compiled'),
          { method: 'get',
            onSuccess: currentCallback,
            onError: currentBadTrip });
        }
      }

      return themes[x];
    }
  }
};

hw.customAppearance = function(init, opt_useCustom) {
  var theme = hw.customGetCurrentTheme();

  var html = '';
  var counter = 0;
  var option;
  if (opt_useCustom) {
    var re = new RegExp('\\* ((?:color|font|image|if|text).*)', 'ig');
    option = re.exec(hw.customDefaultStyleSheet);
  } else {
    option = theme.hasAttribute('data-option-' + counter);
  }
  var uploadButtons = [];

  while (option) {
    var data;
    if (opt_useCustom) {
      data = option[1].split(':');
    } else {
      data = theme.getAttribute('data-option-' + counter).split(':');
    }
    if (data.length > 2) {
      for (var x = 3; x < data.length; ++x) {
        data[2] += ':' + data[x];
      }
    }

    html += '<label for="hw-option-' + counter + '" data-type="' + data[0] + '" data-name="' + data[1] + '" data-default="' + data[2] + '" data-value="' + data[2] + '">'
         +  '<span class="hw-label">' + data[1] + '</span>';

    if (data[0] == 'color') {
      html += '<div id="hw-option-' + counter + '" class="hw-field hw-color-picker" style="background-color:' + data[2] + '" onclick="hw.colorPicker(event, this)"></div>';
    } else if (data[0] == 'font') {
      html += '<select id="hw-option-' + counter + '" class="hw-field" onchange="hw.changeAppearance(this)">';
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
      html += '<input id="hw-option-' + counter + '" class="hw-field" onchange="hw.changeAppearance(this)" type="checkbox" ' + (data[2] == '1' ? checked="checked" : '') + '>';
    } else if (data[0] == 'text') {
      html += '<input id="hw-option-' + counter + '" class="hw-field" onkeypress="hw.changeAppearance(this)" value="' + data[2] + '">';
    }

    html += '</label>';

    ++counter;
    if (opt_useCustom) {
      option = re.exec(hw.customDefaultStyleSheet);
    } else {
      option = theme.hasAttribute('data-option-' + counter);
    }
  }

  hw.$('hw-customize-appearance').innerHTML = html;

  for (var x = 0; x < uploadButtons.length; ++x) {
    hw.uploadButton(hw.uploadButtonHelper(uploadButtons[x]), null, false, false, hw.$(uploadButtons[x]));
  }

  if (!init) {
    hw.customizeUpdatePreview();
  }
};

hw.uploadButtonHelper = function(el) {
  return function(json) {
    hw.customChangeBeforeUnloadState();
    var url = hw.baseUri() + json['url'];
    hw.$(el).parentNode.setAttribute('data-value', url);
    hw.customizeUpdatePreview();
  }
};

hw.changeAppearance = function(el) {
  setTimeout(function() {
    if (el.type == 'checkbox') {
      el.parentNode.setAttribute('data-value', el.checked ? '1' : '0');
    } else {
      el.parentNode.setAttribute('data-value', el.value);
    }

    hw.customChangeBeforeUnloadState();
    hw.customizeUpdatePreview();
  }, 0);
};

hw.customReset = function(event) {
  hw.preventDefault(event);

  var options = hw.$('hw-customize-appearance').getElementsByTagName('LABEL');
  for (var x = 0; x < options.length; ++x) {
    var type = options[x].getAttribute('data-type');
    var defaultOption = options[x].getAttribute('data-default');
    options[x].setAttribute('data-value', defaultOption);

    if (type == 'color') {
      var div = options[x].getElementsByTagName('DIV')[0];
      div.style.backgroundColor = defaultOption;
    } else if (type == 'font') {
      var select = options[x].getElementsByTagName('SELECT')[0];
      for (var y = 0; y < select.options.length; ++y) {
        if (defaultOption.indexOf(select.options[y].value) == 0) {
          select.selectedIndex = y;
          break;
        }
      }
    } else if (type == 'image') {
      var a = options[x].getElementsByTagName('A')[0];
      a.click();
    } else if (type == 'if') {
      var input = options[x].getElementsByTagName('INPUT')[0];
      input.checked = defaultOption == '1';
    } else if (type == 'text') {
      var input = options[x].getElementsByTagName('INPUT')[0];
      input.value = defaultOption;
    }
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
        return "#" + ("0" + red.toString(16)).slice(-2) + ("0" + green.toString(16)).slice(-2) + ("0" + blue.toString(16)).slice(-2);
      }

      return null;
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

hw.customCm = null;
hw.customSetupCodeMirror = function() {
  var onChange = function(editor) {
    editor.save();
    hw.customDefaultStyleSheet = hw.$('hw-theme-editor').value;
  };

  hw.customCm = CodeMirror.fromTextArea(hw.$('hw-theme-editor'), { mode: "css", lineNumbers: true, matchBrackets: true, onChange: onChange });
  hw.customCm.getWrapperElement().setAttribute('name', 'hw-theme-editor');
  hw.addClass(hw.customCm.getWrapperElement(), 'hw-theme-editor');
  setTimeout(function() {
    hw.addClass(hw.customCm.getWrapperElement(), 'hw-all-transition');
  }, 0);
  hw.customCm.getWrapperElement().cm = hw.customCm;
};
