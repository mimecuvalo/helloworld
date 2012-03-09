hw.dragenter = function(event) {
  hw.preventDefault(event);

  if (event.target && event.target.nodeName != "#text") {
    hw.addClass(event.target, 'hw-drag');
  }
};

hw.dragleave = function(event) {
  hw.preventDefault(event);

  if (event.target && event.target.nodeName != "#text") {
    hw.removeClass(event.target, 'hw-drag');
  }
};

hw.dragover = function(event) {
  hw.preventDefault(event);
};

hw.drop = function(event) {
  hw.preventDefault(event);

  var dt = event.dataTransfer;
  var files = dt.files;
  var el = event.target;
  for (var x = 0; x < files.length; ++x) {
    var file = files[x];
    var last = x == files.length - 1;
    var callback = hw.localMediaHelper(file, last);
    if (x > 0) {
      hw.createMediaIframe(callback);
    } else {
      callback(el.ownerDocument);
    }
  }
};

// from quirksmode.org

hw.getEventPos = function(event) {
  var posx = 0;
  var posy = 0;
  if (!event) event = window.event;
  if (event.pageX || event.pageY) {
    posx = event.pageX;
    posy = event.pageY;
  } else if (event.clientX || event.clientY) {
    posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    posy = event.clientY + document.body.scrollTop  + document.documentElement.scrollTop;
  }

  return [posx, posy];
};

hw.dragEl = null;
hw.dragOffsetX = 0;
hw.dragOffsetY = 0;
hw.dragMouseX = 0;
hw.dragMouseY = 0;
hw.dragElementStart = function(event, el) {
  hw.dragEl = el;

  hw.dragOffsetX = parseInt(hw.dragEl.parentNode.style.left);
  hw.dragOffsetY = parseInt(hw.dragEl.parentNode.style.top);

  var pos = hw.getEventPos(event);
  hw.dragMouseX = pos[0];
  hw.dragMouseY = pos[1];
};
hw.dragMouseMove = function(event) {
  if (hw.dragEl) {
    var pos = hw.getEventPos(event);
    hw.dragEl.parentNode.style.left = (hw.dragOffsetX + pos[0] - hw.dragMouseX) + 'px';
    hw.dragEl.parentNode.style.top  = (hw.dragOffsetY + pos[1] - hw.dragMouseY) + 'px';
    if (document.selection) {
      document.selection.empty();
    } else {
      window.getSelection().removeAllRanges();
    }
  }
};
hw.dragMouseUp = function(event) {
  hw.dragEl = null;
};
Event.observe(document, 'mousemove', hw.dragMouseMove, false);
Event.observe(document, 'mouseup', hw.dragMouseUp, false);


hw.dragChromeWorkaroundId = null; // XXX bite me Chrome, why can't you getData in dragOver and dragLeave??
hw.dragStart = function(event, el) {
  event.dataTransfer.setData('text/plain', el.id);
  hw.dragChromeWorkaroundId = el.id;

  var dragInfo = hw.dragLogic(event, el);
  if (!dragInfo['dragAllowed']) {
    return;
  }

  event.dataTransfer.effectAllowed = 'move';
};

hw.dragLogic = function(event, el) {
  var dragAllowed = true;

  // if not editing, disable
  if (hw.$('hw-container') && !hw.hasClass('hw-container', 'hw-editing')) {
    return { 'dragAllowed': false };
  }

  // if renaming, disable as well
  if (hw.hasClass(el, 'hw-renaming')) {
    return { 'dragAllowed': false };
  }

  var id = event.dataTransfer.getData('text/plain') || hw.dragChromeWorkaroundId; // XXX see chrome comment above :-/
  var draggedElement = hw.$(id);

  // if renaming, disable as well
  if (hw.hasClass(draggedElement, 'hw-renaming')) {
    return { 'dragAllowed': false };
  }

  var draggedIsSitemap = id.indexOf('hw-sitemap') == 0;
  var dropIsSitemap = el.id.indexOf('hw-sitemap') == 0;

  var draggedIsAlbum = draggedIsSitemap && id.indexOf('|', 11) != -1;
  var dropIsAlbum = dropIsSitemap && el.id.indexOf('|', 11) != -1;

  var draggedNextSibling = hw.nextSiblingNonText(draggedElement);
  var draggedHasAlbum = draggedIsSitemap && draggedNextSibling && draggedNextSibling.firstChild && draggedNextSibling.firstChild.nodeName == 'UL';
  var draggedAlbum;
  if (draggedHasAlbum) {
    draggedAlbum = draggedNextSibling;
  }
  var dropNextSibling = hw.nextSiblingNonText(el);
  var dropHasAlbum = dropIsSitemap && dropNextSibling && dropNextSibling.firstChild && dropNextSibling.firstChild.nodeName == 'UL';
  var dropAlbum;
  if (dropHasAlbum) {
    dropAlbum = dropNextSibling;
  }

  if (draggedElement.getAttribute('data-is-album') == 'true' && dropIsSitemap) {
    return { 'dragAllowed': false };
  }

  return { 'dragAllowed': dragAllowed,
           'id': id,
           'dropped_id': el.id,
           'draggedIsSitemap': draggedIsSitemap,
           'dropIsSitemap': dropIsSitemap,
           'draggedElement': draggedElement,
           'draggedIsAlbum': draggedIsAlbum,
           'dropIsAlbum': dropIsAlbum,
           'draggedAlbum': draggedAlbum,
           'dropAlbum': dropAlbum };
};

hw.dragOver = function(event, el, album) {
  var dragInfo = hw.dragLogic(event, el);

  if (!dragInfo['dragAllowed']) {
    return;
  }

  // cannot drag top level section into an album
  if (dragInfo['draggedIsSitemap'] && album && !dragInfo['draggedIsAlbum']) {
    return;
  }

  // cannot drag onto itself
  if (el.id == dragInfo['id']) {
    return;
  }

  hw.preventDefault(event);

  if (!dragInfo['draggedIsSitemap']) {
    hw.addClass(el, 'hw-over-content');
  } else if (!dragInfo['draggedIsAlbum'] && dragInfo['dropAlbum']) {
    hw.addClass(hw.nextSiblingNonText(el), 'hw-over');
  } else {
    hw.addClass(el, 'hw-over');
  }
};

hw.dragLeave = function(event, el) {
  var dragInfo = hw.dragLogic(event, el);

  if (!dragInfo['dragAllowed']) {
    return;
  }

  if (!dragInfo['draggedIsSitemap']) {
    hw.removeClass(el, 'hw-over-content');
  } else if (!dragInfo['draggedIsAlbum'] && dragInfo['dropAlbum']) {
    hw.removeClass(hw.nextSiblingNonText(el), 'hw-over');
  } else {
    hw.removeClass(el, 'hw-over');
  }
};

hw.dragDrop = function(event, el) {
  hw.preventDefault(event);

  var dragInfo = hw.dragLogic(event, el);

  if (!dragInfo['dragAllowed']) {
    return;
  }

  var draggedElement = dragInfo['draggedElement'];

  var newSection = dragInfo['draggedIsSitemap'] && el.id.split('|')[1] != draggedElement.id.split('|')[1] ? el.id.split('|')[1] : '';

  draggedElement = draggedElement.parentNode.removeChild(draggedElement);

  var insertedElement;

  if (!dragInfo['draggedIsSitemap']) {
    hw.removeClass(el, 'hw-over-content');
    if (!dragInfo['dropIsSitemap']) {
      insertedElement = el.parentNode.insertBefore(draggedElement, el.nextSibling);
    }
  } else if (dragInfo['draggedIsAlbum']) {
    hw.removeClass(el, 'hw-over');

    if (!dragInfo['dropIsAlbum'] && !dragInfo['dropAlbum']) {
      var li = document.createElement('LI');
      var ul = document.createElement('UL');
      li.appendChild(ul);
      dragInfo['dropAlbum'] = el.parentNode.insertBefore(li, el.nextSibling);
    }

    if (dragInfo['dropIsAlbum']) {
      insertedElement = el.parentNode.insertBefore(draggedElement, el.nextSibling);
    } else {
      insertedElement = dragInfo['dropAlbum'].firstChild.insertBefore(draggedElement, dragInfo['dropAlbum'].firstChild.firstChild);
    }
  } else {
    hw.removeClass(dragInfo['dropAlbum'] ? hw.nextSiblingNonText(el) : el, 'hw-over');
    var insertBeforeElement = dragInfo['dropAlbum'] ? hw.nextSiblingNonText(el).nextSibling : el.nextSibling;
    var albumElement;
    if (dragInfo['draggedAlbum']) {
      albumElement = el.parentNode.insertBefore(dragInfo['draggedAlbum'], insertBeforeElement);
    }
    insertBeforeElement = albumElement ? albumElement : insertBeforeElement;
    insertedElement = el.parentNode.insertBefore(draggedElement, insertBeforeElement);
  }

  var position = 0;
  if ((!dragInfo['dropIsSitemap'] && !dragInfo['draggedIsSitemap']) || dragInfo['draggedIsAlbum']) {
    var albumEl = insertedElement.parentNode.firstChild;
    while (albumEl) {
      if (albumEl.nodeName != "LI") {
        albumEl = albumEl.nextSibling;
        continue;
      }
      if (albumEl.id == insertedElement.id) {
        break;
      }
      ++position;
      albumEl = albumEl.nextSibling;
    }
  } else if (dragInfo['draggedIsSitemap']) {
    var sectionEl = insertedElement.parentNode.firstChild;
    while (sectionEl) {
      if (sectionEl.nodeName != "LI" || !sectionEl.getAttribute('draggable')) {
        sectionEl = sectionEl.nextSibling;
        continue;
      }
      if (sectionEl.id == insertedElement.id) {
        break;
      }
      ++position;
      sectionEl = sectionEl.nextSibling;
    }
  }

  var createForm = hw.$c('hw-create');
  var sectionAlbum = createForm['hw-section'].value + '|' + createForm['hw-name'].value;
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='       + encodeURIComponent('order')
             + '&type='     + encodeURIComponent(!dragInfo['draggedIsSitemap'] ? 'content'
                                                 : (dragInfo['draggedIsAlbum'] ? 'album' : 'section'))
             + '&dragged='  + encodeURIComponent(dragInfo['id'])
             + '&dropped='  + encodeURIComponent(dragInfo['dropped_id'])
             + '&current_section_album='  + encodeURIComponent(sectionAlbum)
             + '&position=' + encodeURIComponent(position)
             + '&new_section=' + encodeURIComponent(newSection),
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value } });
};
