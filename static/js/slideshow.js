hw.mediaSlideshow = function(el, dir) {
  var first;
  var current;
  var last;
  var traversal = el.parentNode.firstChild;

  while (traversal) {
    if (hw.hasClass(traversal, 'hw-media-slideshow-item')) {
      if (!first) {
        first = traversal;
      }
      if (!hw.isHidden(traversal)) {
        current = traversal;
      }
      last = traversal;
    }
    traversal = traversal.nextSibling;
  }
  if (dir == 1) {
    var next = hw.nextSiblingNonText(current);
    if (next && hw.hasClass(next, 'hw-media-slideshow-item')) {
      hw.show(next);
    } else {
      hw.show(first);
    }
    hw.hide(current);
  } else {
    var previous = hw.previousSiblingNonText(current);
    if (previous && hw.hasClass(previous, 'hw-media-slideshow-item')) {
      hw.show(previous);
    } else {
      hw.show(last);
    }
    hw.hide(current);
  }
};

hw.slideshowCurrent = null;
hw.slideshowPaused = true;
hw.slideshowInterval = null;
hw.slideshowSetup = function() {
  var traversal = hw.$('hw-content').firstChild;

  while (traversal) {
    if (traversal.nodeName == 'SECTION') {
      hw.hide(traversal);
      hw.addClass(traversal, 'hw-hidden-transition');
    }
    traversal = traversal.nextSibling;
  }

  hw.hide('hw-user');
  hw.slideshow(null, 0);

  hw.createAutoload = false;

  Event.observe(document, 'keyup', hw.slideshowKeys, false);
  Event.observe(document, 'click', hw.slideshowClick, false);

  hw.slideshowPause();
};

hw.slideshow = function(dir, specificPage, show_last) {
  if (!hw.hasClass('hw-content', 'hw-presentation')) {
    return;
  }

  var first;
  var current;
  var last;
  var specific;
  var traversal = hw.$('hw-content').firstChild;
  var index = 0;

  while (traversal) {
    if (traversal.nodeName == 'SECTION') {
      if (!first) {
        first = traversal;
      }
      if (!hw.isHidden(traversal)) {
        current = traversal;
      }
      last = traversal;
      if (index == specificPage) {
        specific = traversal;
      }
      ++index;
    }
    traversal = traversal.nextSibling;
  }
  if (show_last) {
    specific = last;
  }
  if (specificPage != undefined || show_last) {
    hw.show(specific);
    hw.slideshowCurrent = specific;
    if (current) {
      hw.hide(current);
    }
  } else if (dir == 1) {
    var next = hw.nextSiblingNonText(current);
    if (next && next.nodeName == 'SECTION') {
      hw.show(next);
      hw.slideshowCurrent = next;
    } else {
      hw.show(first);
      hw.slideshowCurrent = first;
    }
    hw.hide(current);
  } else if (dir == -1) {
    var previous = hw.previousSiblingNonText(current);
    if (previous && previous.nodeName == 'SECTION') {
      hw.show(previous);
      hw.slideshowCurrent = previous;
    } else {
      hw.show(last);
      hw.slideshowCurrent = last;
    }
    hw.hide(current);
  }
};

hw.slideshowTogglePlain = function(event) {
  hw.stopPropagation(event);

  var plain = hw.hasClass('hw-content', 'hw-presentation');
  hw.setClass('hw-content', 'hw-presentation', !plain);
  hw.display('hw-user', plain);
  hw.$('hw-content').style.position = plain ? 'static' : 'fixed';

  var traversal = hw.$('hw-content').firstChild;
  while (traversal) {
    if (traversal.nodeName == 'SECTION') {
      hw.display(traversal, plain);
    }
    traversal = traversal.nextSibling;
  }

  hw.show(hw.slideshowCurrent);
};

hw.slideshowKeys = function(event) {
  var key = event.which ? event.which : event.keyCode;
  hw.slideshowPause(null, true);
  switch (key) {
    case 10: // return
    case 13: // enter
    case 32: // spacebar
    case 34: // page down
    case 39: // rightkey
    case 40: // downkey
      hw.slideshow(1);
      break;
    case 33: // page up
    case 37: // leftkey
    case 38: // upkey
      hw.slideshow(-1);
      break;
    case 36: // home
      hw.slideshow(null, 0);
      break;
    case 35: // end
      hw.slideshow(null, null, true);
      break;
    case 67: // c
      hw.slideshowTogglePlain(event);
      break;
  }
};

hw.slideshowClick = function(event) {
  var target = event.target ? event.target : event.srcElement;
  if (target.nodeName != 'A' && target.parentNode.nodeName != 'A') {
    hw.slideshowPause(null, true);
    hw.slideshow(1);
  }
};

hw.slideshowControl = function(event, dir, specificPage) {
  hw.preventDefault(event);
  hw.stopPropagation(event);
  hw.slideshow(dir, specificPage);
};

hw.slideshowPause = function(event, forcePause) {
  if (event) {
    hw.preventDefault(event);
    hw.stopPropagation(event);
  }

  if (!forcePause && hw.slideshowPaused) {
    hw.slideshowInterval = setInterval(function() { hw.slideshow(1) }, 5000);
  } else {
    clearInterval(hw.slideshowInterval);
  }
  hw.$('hw-slideshow-pause').innerHTML = hw.$('hw-slideshow-pause').
      getAttribute('data-' + (!forcePause && hw.slideshowPaused ?
      'pause' : 'play'));
  hw.slideshowPaused = forcePause || !hw.slideshowPaused;
};
