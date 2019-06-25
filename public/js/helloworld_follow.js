(function() {
  var scripts = document.getElementsByTagName('SCRIPT');
  for (var i = 0; i < scripts.length; ++i) {
    if (scripts[i].src.indexOf('helloworld_follow.js') !== -1) {
      var origin = new URL(scripts[i].src).origin;
      window.location.href = origin + '/api/social/follow?resource=' + encodeURIComponent(window.location.href);
      break;
    }
  }
})()
