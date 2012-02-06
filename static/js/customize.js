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
      headers: { 'X-Xsrftoken' : hw.$('customize-form')['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};
