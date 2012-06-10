(function() {
  var host;
  var url = encodeURIComponent(window.location.href);

  function findImages() {
    var imageFinder = document.getElementById('hw-image-finder');
    if (imageFinder) {
      imageFinder.parentNode.removeChild(imageFinder);
    }

    var imagesArray = [];

    var iframes = document.getElementsByTagName('IFRAME');
    var images = document.getElementsByTagName('IMG');
    var dupCache = {};

    function parseImages(images) {
      for (var x = 0; x < images.length; ++x) {
        var img = document.createElement('IMG');
        images[x].setAttribute('width', '');
        images[x].setAttribute('height', '');
        if (images[x].width * images[x].height > 16384
            && !(images[x].src in dupCache) && images[x].style.display != 'none') {
          img.src = images[x].src;
          dupCache[img.src] = 1;
          imagesArray.push(img);
        }
      }
    }
    parseImages(images);
    // tumblr does photosets in iframes
    for (var x = 0; x < iframes.length; ++x) {
      try {
        var iframeImages = iframes[x].contentDocument.getElementsByTagName('IMG');
        parseImages(iframeImages);
      } catch(ex) { }
    }

    images = imagesArray;
    images.sort(function(a, b) {
      var aArea = a.width * a.height;
      var bArea = b.width * b.height;
      if (aArea > bArea)
        return -1;
      if (aArea < bArea)
        return 1;
      return 0;
    });
    var wrapper = document.createElement('DIV');
    wrapper.setAttribute('id', 'hw-image-finder');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.right = '0';
    wrapper.style.height = '200px';
    wrapper.style.padding = '10px';
    wrapper.style.whiteSpace = 'nowrap';
    wrapper.style.overflowX = 'scroll';
    wrapper.style.backgroundColor = '#fff';
    wrapper.style.borderBottom = '1px solid #999';
    wrapper.style.boxShadow = '0px 0px 10px 5px #999';
    wrapper.style.zIndex = '4294967295';

    var selectImage = function(img) {
      // send it off!
      window.location.href = host + 'dashboard#reblog=' + url + '&img='
          + encodeURIComponent(img.src);
    };
    for (var x = 0; x < images.length; ++x) {
      images[x].style.maxHeight = '190px';
      images[x].style.margin = '0';
      images[x].style.padding = '0';
      images[x].style.border = '0';
      images[x].style.marginRight = '10px';
      images[x].style.cursor = 'pointer';
      images[x].onmouseover = function() {
        this.style.outline = '5px solid #0ac';
      };
      images[x].onmouseout = function() {
        this.style.outline = 'none';
      };
      images[x].onclick = function() {
        selectImage(this);
      };
      wrapper.appendChild(images[x]);
    }

    var close = document.createElement('A');
    close.href = '#close-image-finder';
    close.textContent = '×';
    close.style.fontSize = '20px';
    close.style.fontFamily = '"Helvetica Neue",Arial,sans-serif';
    close.style.position = 'fixed';
    close.style.top = '0';
    close.style.right = '5px';
    close.style.textDecoration = 'none';
    close.style.padding = '5px';
    close.style.backgroundColor = '#fff';
    close.style.border = '0';
    close.style.color = '#000';
    close.onclick = function() {
      var imageFinder = document.getElementById('hw-image-finder');
      imageFinder.parentNode.removeChild(imageFinder);
    };
    wrapper.appendChild(close);
    document.body.appendChild(wrapper);
  }

  var scripts = document.getElementsByTagName('SCRIPT');
  for (var x = 0; x < scripts.length; ++x) {
    if (scripts[x].src.indexOf('hw_reblog.js') != -1) {
      host = scripts[x].src.match(/.*:\/\/.*?\//)[0];
      break;
    }
  }

  var hasOembedOrOpenGraph = false;
  var links = document.getElementsByTagName('LINK');
  for (var y = 0; y < links.length; ++y) {
    var type = links[y].getAttribute('type');
    if (type == 'text/xml+oembed' || type == 'application/xml+oembed' || type == 'application/json+oembed') {
      hasOembedOrOpenGraph = true;
      break;
    }
  }

  var meta = document.getElementsByTagName('META');
  for (var y = 0; y < links.length; ++y) {
    var property = links[y].getAttribute('property');
    if (property == 'og:title' || property == 'og:image') {
      hasOembedOrOpenGraph = true;
      break;
    }
  }

  if (hasOembedOrOpenGraph) {
    // send it off!
    window.location.href = host + 'dashboard#reblog=' + url;
  } else {
    findImages();
  }
})()
