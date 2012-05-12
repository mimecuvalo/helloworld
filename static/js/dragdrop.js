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


hw.dragChromeWorkaroundId = null; // XXX bite me Chrome, why can't you getData in dragOver and dragLeave??
hw.dragStart = function(event, el) {
  hw.stopPropagation(event);

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

  var draggedIsAlbum = draggedIsSitemap && draggedElement.getAttribute('data-sitemap-album');
  var dropIsAlbum = dropIsSitemap && el.getAttribute('data-sitemap-album');

  var draggedIsContentAlbum = draggedElement.getAttribute('data-is-album') == 'true';

  var draggedAlbum = draggedElement.getElementsByTagName('UL');
  var draggedHasAlbum = draggedIsSitemap && draggedAlbum.length;
  if (draggedHasAlbum) {
    draggedAlbum = draggedAlbum[0];
  }
  var dropAlbum = el.getElementsByTagName('UL');
  var dropHasAlbum = dropIsSitemap && dropAlbum.length;
  if (dropHasAlbum) {
    dropAlbum = dropAlbum[0];
  }

  if (draggedIsContentAlbum && dropIsSitemap) {
    return { 'dragAllowed': false };
  }

  if (draggedIsSitemap && !dropIsSitemap) {
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

  hw.stopPropagation(event);

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
  } else {
    hw.addClass(el, 'hw-over');
  }
};

hw.dragLeave = function(event, el) {
  var dragInfo = hw.dragLogic(event, el);

  hw.stopPropagation(event);

  if (!dragInfo['dragAllowed']) {
    return;
  }

  if (!dragInfo['draggedIsSitemap']) {
    hw.removeClass(el, 'hw-over-content');
  } else {
    hw.removeClass(el, 'hw-over');
  }
};

hw.dragDrop = function(event, el) {
  hw.preventDefault(event);
  hw.stopPropagation(event);

  var dragInfo = hw.dragLogic(event, el);

  if (!dragInfo['dragAllowed']) {
    return;
  }

  var draggedElement = dragInfo['draggedElement'];

  var newSection = dragInfo['draggedIsSitemap'] && el.id.split('_')[1] != draggedElement.id.split('_')[1] ? el.id.split('_')[1] : '';

  // remove item from current position
  draggedElement = draggedElement.parentNode.removeChild(draggedElement);

  var insertedElement;

  // move item into new place
  if (!dragInfo['draggedIsSitemap']) {
    hw.removeClass(el, 'hw-over-content');
    if (!dragInfo['dropIsSitemap']) {
      insertedElement = el.parentNode.insertBefore(draggedElement, el.nextSibling);
    }
  } else if (dragInfo['draggedIsAlbum']) {
    hw.removeClass(el, 'hw-over');

    if (!dragInfo['dropIsAlbum'] && !dragInfo['dropAlbum']) {
      var ul = document.createElement('UL');
      dragInfo['dropAlbum'] = el.appendChild(ul);
    }

    if (dragInfo['dropIsAlbum']) {
      insertedElement = el.parentNode.insertBefore(draggedElement, el.nextSibling);
    } else {
      insertedElement = dragInfo['dropAlbum'].insertBefore(draggedElement, dragInfo['dropAlbum'].firstChild);
    }
  } else {
    hw.removeClass(el, 'hw-over');
    insertedElement = el.parentNode.insertBefore(draggedElement, el.nextSibling);
  }

  // calculate new position
  var position = 0;
  if (insertedElement) {
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

  // send off to server
  var createForm = hw.$c('hw-create');
  var sectionAlbum = createForm['hw-section'].value + '_' + createForm['hw-name'].value;
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


hw.followingDragStart = function(event, el) {
  event.dataTransfer.setData('text/plain', el.id);
  event.dataTransfer.effectAllowed = 'move';
};

hw.followingDragOver = function(event, el) {
  if (!el || el.nodeName != 'LI' || !el.id || !el.id.match(/hw-following-/)) {
    return;
  }

  hw.preventDefault(event);

  hw.addClass(el, 'hw-over');
};

hw.followingDragLeave = function(event, el) {
  hw.removeClass(el, 'hw-over');
};

hw.followingDragDrop = function(event, el) {
  hw.preventDefault(event);

  var id = event.dataTransfer.getData('text/plain');
  var draggedElement = hw.$(id);
  draggedElement = draggedElement.parentNode.removeChild(draggedElement);

  var insertedElement;

  hw.removeClass(el, 'hw-over');
  var insertBeforeElement = el.nextSibling;
  insertedElement = el.parentNode.insertBefore(draggedElement, insertBeforeElement);

  var position = 0;  // we have read all/your feed/favorites/comments/twitter/fb/goog/tumblr in front
  var followingList = hw.$('hw-following-list');
  var followingListLis = followingList.getElementsByTagName('LI');
  for (var x = 0; x < followingListLis.length; ++x) {
    if (followingListLis[x].hasAttribute('draggable')) {
      break;
    }
    --position;
  }

  var sectionEl = insertedElement.parentNode.firstChild;
  while (sectionEl) {
    if (sectionEl.nodeName != "LI") {
      sectionEl = sectionEl.nextSibling;
      continue;
    }
    if (sectionEl.id == insertedElement.id) {
      break;
    }
    ++position;
    sectionEl = sectionEl.nextSibling;
  }

  var createForm = hw.$c('hw-create');
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='       + encodeURIComponent('order_following')
             + '&dragged='  + encodeURIComponent(id)
             + '&position=' + encodeURIComponent(position),
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value } });
};
