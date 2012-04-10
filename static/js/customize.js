hw.setupFields = false;
hw.customSetupFields = function() {
  if (hw.setupFields) {
    return;
  }
  hw.setupFields = true;

  var fields = hw.$$('.hw-field');
  for (var x = 0; x < fields.length; ++x) {
    Event.observe(fields[x], 'focus', function() { hw.customChangeBeforeUnloadState(); }, false);
  }
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
             + '&background='          + encodeURIComponent(customForm['background'].value)
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

    body.style.backgroundImage = 'url(' + (hw.$('hw-background').value || hw.pixelSrc) + ')';
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

  customForm['theme'].value              = el.getAttribute('data-path');
  hw.$('hw-theme-thumb').src             = el.getAttribute('data-thumb');
  hw.$('hw-theme-title').innerHTML       = el.getAttribute('data-title');
  //hw.$('hw-theme-link').innerHTML        = el.getAttribute('data-link');
  hw.display(hw.$('hw-theme-author'), el.getAttribute('data-author'));
  hw.$('hw-theme-author-name').innerHTML = el.getAttribute('data-author');
  hw.$('hw-theme-author-link').href      = el.getAttribute('data-author-link');
  hw.customizeUpdatePreview();
};
