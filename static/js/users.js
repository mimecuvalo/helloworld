hw.saveUser = function(event, el) {
  var row = el.parentNode.parentNode;
  var inputs = row.getElementsByTagName('INPUT');

  for (var x = 0; x < inputs.length; ++x) {
    var key = inputs[x].name;
    inputs[key] = { };
    inputs[key].el = inputs[x];
    inputs[key].value = inputs[x].value;
    inputs[key].checked = inputs[x].checked;
  }

  var id = inputs['id'] ? inputs['id'].value : "";
  var changingSuperuser = el.name == 'superuser';

  if ((id == '1' || id == currentUserId) && changingSuperuser && !el.checked) {
    if (!window.confirm(hw.getMsg('confirm-delete'))) {
      hw.preventDefault(event);
      return;
    }
  }

  var callback = function(xhr) {
    if (id == "") {
      window.location.href = hw.baseUri() + 'users';
    } else {
      hw.removeClass(row, 'normal');
      hw.addClass(row, 'good');
      var callback = function() {
        hw.addClass(row, 'normal');
        hw.removeClass(row, 'good');
      };
      setTimeout(callback, 200);
    }
  };

  var badTrip = function(xhr) {
    hw.removeClass(row, 'normal');
    hw.addClass(row, 'bad');
    var callback = function() {
      hw.addClass(row, 'normal');
      hw.removeClass(row, 'bad');
    };
    setTimeout(callback, 200);
    el.checked = !el.checked;
  };

  if (inputs['superuser'].checked) {
    inputs['author'].checked = true;
    inputs['author'].el.checked = true;
  }

  new hw.ajax(hw.baseUri() + 'users/' + inputs['username'].value,
    { method: id == "" ? 'post' : 'put',
      postBody:  'oauth='        + encodeURIComponent(inputs['oauth'].value)
              + '&name='         + encodeURIComponent(inputs['name'].value)
              + '&author='       + encodeURIComponent(inputs['author'].checked ? 1 : 0)
              + '&superuser='    + encodeURIComponent(inputs['superuser'].checked ? 1 : 0),
      headers: { 'X-Xsrftoken' : el.form['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.deleteUser = function(el) {
  if (!window.confirm(hw.getMsg('confirm-delete'))) {
    return;
  }

  var callback = function(xhr) {
    window.location.href = hw.baseUri() + 'users';
  };

  var badTrip = function(xhr) {
    alert(hw.getMsg('delete-failed'));
  };

  var row_inputs = el.parentNode.parentNode.getElementsByTagName('INPUT');
  var username = row_inputs[1].value;

  new hw.ajax(hw.baseUri() + 'users/' + username,
    { method: 'delete',
      headers: { 'X-Xsrftoken' : el.form['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};
