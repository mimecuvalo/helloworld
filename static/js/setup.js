hw.setup = function() {
  var badTrip = function(xhr) {
    alert(hw.getMsg('failed'));
  };

  var callback = function(xhr) {
    var restartCallback = function() {
      var fn = function() {
        window.location.href = hw.$('hw-setup-form').action;
      };
      setTimeout(fn, 1000);
    };

    // restart the server
    new hw.ajax(hw.$('hw-setup-form').action + '?kill=true',
      { method: 'get',
        onSuccess: restartCallback,
        onError: restartCallback });
  };

  var form = hw.$('hw-setup-form');

  new hw.ajax(hw.$('hw-setup-form').action,
    { method: 'post',
      postBody:  'prefix='     + encodeURIComponent(form['prefix'].value)
              + '&username='   + encodeURIComponent(form['username'].value)
              + '&email='      + encodeURIComponent(form['email'].value)
              + '&mysql_host=' + encodeURIComponent(form['mysql_host'].value)
              + '&mysql_database=' +
                  encodeURIComponent(form['mysql_database'].value)
              + '&mysql_user=' + encodeURIComponent(form['mysql_user'].value)
              + '&mysql_password=' +
                  encodeURIComponent(form['mysql_password'].value),
      onSuccess: callback,
      onError: badTrip });
};

