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

  hw.changeBeforeUnloadState(true);
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
