var scripts = document.getElementsByTagName('SCRIPT');
for (var x = 0; x < scripts.length; ++x) {
  if (scripts[x].src.indexOf('hw_reblog.js') != -1) {
    var host = scripts[x].src.match(/.*:\/\/.*?\//)[0];
    window.location.href = host + 'dashboard#reblog=' + encodeURIComponent(window.location.href);
    break;
  }
}
