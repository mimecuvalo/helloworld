(function () {
  let host;
  const url = encodeURIComponent(window.location.href);

  function findImages() {
    const imageFinder = document.getElementById('hw-image-finder');
    if (imageFinder) {
      imageFinder.parentNode.removeChild(imageFinder);
    }

    const imagesArray = [];

    const iframes = document.getElementsByTagName('IFRAME');
    const imageElements = document.getElementsByTagName('IMG');
    const dupCache = {};

    function parseImages(images) {
      for (let i = 0; i < images.length; ++i) {
        const img = document.createElement('IMG');
        images[i].setAttribute('width', '');
        images[i].setAttribute('height', '');

        if (
          images[i].width * images[i].height > 16384 &&
          !(images[i].src in dupCache) &&
          images[i].style.display !== 'none'
        ) {
          img.src = images[i].src;
          dupCache[img.src] = true;
          imagesArray.push(img);
        }
      }
    }

    parseImages(imageElements);

    // tumblr does photosets in iframes
    for (let i = 0; i < iframes.length; ++i) {
      try {
        const iframeImages = iframes[i].contentDocument.getElementsByTagName('IMG');
        parseImages(iframeImages);
      } catch {
        /* do nothing */
      }
    }

    if (!imagesArray.length) {
      // send it off!
      window.location.href = host + '/dashboard#reblog=' + url;
      return;
    }

    imagesArray.sort(function (a, b) {
      const aArea = a.width * a.height;
      const bArea = b.width * b.height;
      if (aArea > bArea) return -1;
      if (aArea < bArea) return 1;
      return 0;
    });

    const wrapper = document.createElement('DIV');
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
    wrapper.style.textAlign = 'left';

    const selectImage = function (img) {
      // send it off!
      window.location.href = host + '/dashboard#reblog=' + url + '&img=' + encodeURIComponent(img.src);
    };

    if (imagesArray.length === 1) {
      selectImage(imagesArray[0]);
      return;
    }

    for (let i = 0; i < imagesArray.length; ++i) {
      imagesArray[i].style.maxHeight = '190px';
      imagesArray[i].style.maxWidth = '270px';
      imagesArray[i].style.margin = '0';
      imagesArray[i].style.padding = '0';
      imagesArray[i].style.border = '0';
      imagesArray[i].style.marginRight = '10px';
      imagesArray[i].style.cursor = 'pointer';
      imagesArray[i].onmouseover = function () {
        this.style.outline = '5px solid #0ac';
      };
      imagesArray[i].onmouseout = function () {
        this.style.outline = 'none';
      };
      imagesArray[i].onclick = function () {
        selectImage(this);
      };
      wrapper.appendChild(imagesArray[i]);
    }

    const close = document.createElement('A');
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

    const closePicker = function () {
      const imageFinder = document.getElementById('hw-image-finder');
      imageFinder.parentNode.removeChild(imageFinder);

      window.removeEventListener('keyup', documentKeyUp);
      window.removeEventListener('click', documentClick);
      return false;
    };

    const documentKeyUp = function (event) {
      if (event.key === 'Escape') {
        closePicker();
      }
    };

    const documentClick = function (event) {
      if (document.getElementById('hw-image-finder').contains(event.target)) {
        return;
      }

      closePicker();
    };

    close.onclick = closePicker;
    wrapper.appendChild(close);
    document.body.appendChild(wrapper);

    window.addEventListener('keyup', documentKeyUp);
    window.addEventListener('click', documentClick);
  }

  const scripts = document.getElementsByTagName('SCRIPT');
  for (let i = 0; i < scripts.length; ++i) {
    if (scripts[i].src.indexOf('helloworld_reblog.js') !== -1) {
      host = new URL(scripts[i].src).origin;
      break;
    }
  }

  let hasOembedOrOpenGraph = false;
  const links = document.getElementsByTagName('LINK');
  for (let i = 0; i < links.length; ++i) {
    if (links[i].getAttribute('type') === 'application/json+oembed') {
      hasOembedOrOpenGraph = true;
      break;
    }
  }

  for (let i = 0; i < links.length; ++i) {
    const property = links[i].getAttribute('property');
    if (property === 'og:title' || property === 'og:image') {
      hasOembedOrOpenGraph = true;
      break;
    }
  }

  if (hasOembedOrOpenGraph) {
    // send it off!
    window.location.href = host + '/dashboard#reblog=' + url;
  } else {
    findImages();
  }
})();
