hw.insertHTML = function(html) {
  if (hw.isIE) {
    var range = document.selection.createRange();
    range.pasteHTML(html);
  } else {
    document.execCommand("insertHTML", false, html);
  }

  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  if (!isComment) {
    hw.changeBeforeUnloadState();
  }
};


hw.changeBeforeUnloadState = function(event, allowPageChange) {
  if (hw.$('hw-container') && !hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  var createForm = hw.$c('hw-create');
  var wysiwyg = hw.$c('hw-wysiwyg');
  var noChange = hw.text(wysiwyg).replace('\n', '') == hw.getMsg('untitled')
      || hw.text(wysiwyg) == '';
  noChange = noChange && !createForm['hw-code'].value &&
      !createForm['hw-style'].value;
  noChange = noChange && wysiwyg.innerHTML.search(/<(?!\/?(h1|br))/ig) == -1;
  allowPageChange = allowPageChange || noChange;

  window.onbeforeunload = allowPageChange ? null : function() {
    return hw.getMsg('unsaved-changes');
  };

  var createForm = hw.$c('hw-create');
  var title = "";
  if (!createForm['hw-id'].value) {
    var newTitle = hw.$('hw-new-title');
    if (newTitle && hw.text(newTitle) != hw.getMsg('untitled')) {
      title = hw.text(newTitle);
      hw.addClass(newTitle, 'hw-modified-title');
    } else {
      title = '(' + hw.getMsg('untitled') + ')';
      hw.removeClass(newTitle, 'hw-modified-title');
    }
  } else {
    title = createForm['hw-title'].value || '(' + hw.getMsg('untitled') + ')';
  }
  document.title = hw.contentOwnerTitle.replace(/&quot;/g, '"')
                + (hw.contentOwnerTitle && title ? ' - ' : '')
                + title.replace(/&quot;/g, '"')
                + (allowPageChange ? '' : ' +');
};

hw.modify = function(alter, direction, granularity) {
  if (document.selection && document.selection.createRange) {
    // TODO fix on IE
    //var range = document.selection.createRange();
    //range.move(granularity, direction == 'forward' ? 1 : -1)
  } else if (window.getSelection) {
    var sel = window.getSelection();
    sel.modify(alter, direction, granularity);
  }
};

hw.commentSubmit = function() {
  var form       = hw.$c('hw-comment-form');
  var comment    = hw.$c('hw-comment-input');
  var localUser  = comment.getAttribute('data-local-username');
  var localName  = comment.getAttribute('data-local-name');
  var thread     = comment.hasAttribute('data-thread')      ?
      comment.getAttribute('data-thread')      : '';
  var threadUser = comment.hasAttribute('data-thread-user') ?
      comment.getAttribute('data-thread-user') : '';

  var callback = function(xhr) {
    comment.innerHTML = '';
    window.location.reload();
  };

  var badTrip = function(xhr) {
    alert(form.getAttribute('data-error'));
  };

  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='          + encodeURIComponent('comment')
             + '&local_user='  + encodeURIComponent(localUser)
             + '&local_name='  + encodeURIComponent(localName)
             + '&thread='      + encodeURIComponent(thread)
             + '&thread_user=' + encodeURIComponent(threadUser)
             + '&comment='     + encodeURIComponent(comment.innerHTML),
      headers: { 'X-Xsrftoken' : form['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.reply = function(event, el) {
  if (event) {
    hw.preventDefault(event);
  }

  var username = el.parentNode.getAttribute('data-username');
  var user = el.parentNode.getAttribute('data-user');
  var type = el.parentNode.getAttribute('data-type');

  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];

  if (document.body.parentNode.scrollTop) {
    document.body.parentNode.scrollTop = document.body.parentNode.scrollTop +
        wysiwyg.getBoundingClientRect().top - 100;
  } else {
    document.body.scrollTop = document.body.scrollTop +
        wysiwyg.getBoundingClientRect().top - 100;
  }

  for (var x = 0; x < hw.externalSources.length; ++x) {
    var sourceEl = hw.$('hw-post-' + hw.externalSources[x]);
    if (sourceEl && hw.externalSources[x] == type) {
      sourceEl.checked = true;
    }
  }

  var dataPostId = el.parentNode.getAttribute('data-post-id');

  if (user) {
    wysiwyg.innerHTML = '<a href="' + user + '">@' + username + '</a>&nbsp;';
  } else {
    wysiwyg.innerHTML = '@' + username + '&nbsp;';
  }
  wysiwyg.innerHTML += ', ' + '<a href="' + dataPostId + '">' +
      hw.getMsg('source') + '</a> '
  wysiwyg.focus();

  // move to end of doc...TODO make simpler? use modify?
  if (document.createRange) {
    var range = document.createRange();
    range.selectNodeContents(wysiwyg);
    range.collapse(false);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (document.selection) {
    var range = document.body.createTextRange();
    range.moveToElementText(wysiwyg);
    range.collapse(false);
    range.select();
  }

  if (hw.$c('hw-thread')) {
    hw.$c('hw-thread').value = dataPostId;
  }
};

hw.postTopic = function(topic) {
  var form     = hw.$c('hw-post-form');
  var username = topic.getAttribute('data-username');
  var section  = topic.getAttribute('data-section');
  var album    = topic.getAttribute('data-album');

  var callback = function(xhr) {
    topic.value = '';
    window.location.href = xhr.getResponseHeader('Location');
  };

  var badTrip = function(xhr) {
    alert(form.getAttribute('data-error'));
  };

  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='        + encodeURIComponent('topic')
             + '&username='  + encodeURIComponent(username)
             + '&section='   + encodeURIComponent(section)
             + '&album='     + encodeURIComponent(album)
             + '&topic='     + encodeURIComponent(topic.value),
      headers: { 'X-Xsrftoken' : form['_xsrf'].value },
      onSuccess: callback,
      onError: badTrip });
};

hw.commentHelp = function(event) {
  hw.preventDefault(event);

  var help = hw.$c('hw-comment-help');
  var openHelp = hw.isHidden(help);
  hw.setClass(hw.$c('hw-comment-help-button'), 'hw-selected', openHelp);
  hw.display(help, openHelp);
};

hw.wysiwygKeymap = {
  9:  'insertUnorderedList',  // tab
  33: 'createLink',   // !
  42: 'bold',         // *
  //47: 'italic',       // /
  95: 'underline'     // _
};

hw.lastActiveWysiwyg = null;
hw.getCurrentWysiwyg = function() {
  var wysiwyg;
  var dontAccessActiveElement = false;
  try {
    if (document.activeElement && document.activeElement.nodeName) {
      // do nothing
    }
  } catch(ex) {
    // XXX firefox throws error if activeElement is currently the upload button,
    // post-uploading
    dontAccessActiveElement = true;
  }
  if (!dontAccessActiveElement && document.activeElement &&
      document.activeElement.nodeName == 'DIV'
      && document.activeElement.hasAttribute('contenteditable') &&
      !hw.hasClass(document.activeElement, 'hw-paste-area')) {
    wysiwyg = document.activeElement;
  } else {
    wysiwyg = hw.lastActiveWysiwyg || (hw.hasClass('hw-container', 'hw-editing')
    && hw.$c('hw-wysiwyg')) || hw.$c('hw-comment-input');
  }
  hw.lastActiveWysiwyg = wysiwyg;
  if (!wysiwyg) {
    return null;
  }

  var isComment = hw.hasClass(wysiwyg, 'hw-comment-input');
  return { 'isComment': isComment, 'wysiwyg': isComment ?
      hw.$c('hw-comment-input') : hw.$c('hw-wysiwyg') };
};

hw.shiftKeyPressed = false;
hw.wysiwygKeyDown = function(event) {
  if (!hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  hw.shiftKeyPressed = event.shiftKey;

  var key = event.which || event.keyCode;

  switch (key) {
    case 9: // tab
      hw.preventDefault(event);
      hw.wysiwygKeys(event);
      break;
    case 37:  // left
    case 38:  // up
    case 39:  // right
    case 40:  // down
      hw.wysiwygLastKeys = "";
      break;
    case 66:   // ctrl-b, bold
      if (hw.testAccelKey(event)) {
        hw.preventDefault(event);
        hw.wysiwygKeys(event, 42);
      }
      break;
    case 85:   // ctrl-u, underline
      if (hw.testAccelKey(event)) {
        hw.preventDefault(event);
        hw.wysiwygKeys(event, 95);
      }
      break;
    case 83:
      // ctrl-s, save  TODO report bug to ff, messed up with dvorak keyboard
      if (hw.testAccelKey(event)) {
        hw.preventDefault(event);
        hw.save();
      }
      break;
    default:
      break;
  }
};

hw.wysiwygKeyUp = function(event) {
  hw.shiftKeyPressed = false;
};

hw.wysiwygLastKeys = "";
hw.wysiwygKeys = function(event, opt_key) {
  var key = opt_key || event.charCode || event.keyCode || event.which;
  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];

  if (document.activeElement == wysiwyg) {
    switch (key) {
      case 8:   // backspace
        hw.wysiwygLastKeys = hw.wysiwygLastKeys.substring(0,
            hw.wysiwygLastKeys.length - 1);
        break;
      case 9:   // tab
      case 33:  // !
      case 42:  // *
      //case 47:  // /
      case 95:  // _
        var action = hw.wysiwygKeymap[key];

        var skipExec = false;
        var value = null;

        if (action == "createLink") {
          var startNode = hw.getSelectionStartNode();
          if (startNode.nodeName == 'A') {
            skipExec = true;
            var fragment = document.createDocumentFragment();
            for (var x = 0; x < startNode.childNodes.length; ++x) {
              fragment.appendChild(startNode.childNodes[x]);
            }
            startNode.parentNode.replaceChild(fragment, startNode);
            hw.hideElementOptions();
            return;
          } else {
            if (!hw.selection.toString()) {
              return;
            }
            value = "http://";
          }
        }

        var previousSelection = hw.selection.toString();
        if (!skipExec) {
          document.execCommand(action, false, value);
        }
  
        if (action == "createLink") {
          var anchorTag = hw.getSelectionStartNode(true).nextSibling;
          hw.showAnchorEditor(anchorTag);
          hw.$c('hw-anchor-link').value = value;
          hw.$c('hw-anchor-visit').href = '';
          hw.$c('hw-anchor-link').focus();
          hw.$c('hw-anchor-link').select();
        }

        if (key == 9) {
          hw.preventDefault(event);
        } else if (hw.wysiwygLastKeys[hw.wysiwygLastKeys.length - 1] ==
            String.fromCharCode(key) && !previousSelection) {
          hw.wysiwygLastKeys = "";
        } else {
          hw.preventDefault(event);
          hw.wysiwygLastKeys += String.fromCharCode(key);
        }
        break;

      case 32:  // space
        // auto-tag things
        setTimeout(function() {
          if (isComment) {
            return;
          }

          var hashIndex = hw.wysiwygLastKeys.lastIndexOf('#');
          if (hashIndex == -1) {
            hw.wysiwygLastKeys = "";
            return;
          }

          var charsBack = hw.wysiwygLastKeys.length - hashIndex;
          if (charsBack <= 1) {
            hw.wysiwygLastKeys = "";
            return;
          }

          hw.modify("move", "backward", "character");
          for (var x = 0; x < charsBack; ++x) {
            hw.modify("extend", "backward", "character");
          }
          var tag = hw.wysiwygLastKeys.substring(hashIndex + 1);

          document.execCommand("createLink", false, hw.tagUrl + tag);

          hw.modify("move", "forward", "character");
          hw.modify("move", "forward", "character");

          hw.wysiwygLastKeys = "";
        }, 0);
        break;

      case 43:
      case 64:    // + or @, autocomplete remote_user
        if (isComment) {
          break;
        }
        if (hw.wysiwygLastKeys[hw.wysiwygLastKeys.length - 1] ==
            String.fromCharCode(key)) {
          hw.wysiwygLastKeys = "";
        } else {
          hw.wysiwygLastKeys += String.fromCharCode(key);
          setTimeout(function() {
            hw.showUserAutocomplete();
          }, 0);
        }
        break;
      case 45: // -
        if (hw.wysiwygLastKeys.slice(-2) == "--") {
          hw.preventDefault(event);
          for (var x = 0; x < 2; ++x) {
            hw.modify("extend", "backward", "character");
          }
          hw.insertHTML('<hr>');
          hw.wysiwygLastKeys = "";
        } else if (hw.wysiwygLastKeys.slice(-5) == "-more") {
          hw.preventDefault(event);
          for (var x = 0; x < 5; ++x) {
            hw.modify("extend", "backward", "character");
          }
          hw.insertHTML('<img class="hw-read-more" src="/helloworld/static/img/pixel.gif?v=df3e5">');
          hw.wysiwygLastKeys = "";
        } else {
          hw.wysiwygLastKeys += String.fromCharCode(key);
        }
        break;

      default:
        // modify existing tags
        setTimeout(function() {
          if (isComment) {
            return;
          }

          var tag = hw.getSelectionStartNode();
          if (tag && tag.nodeName == 'A' && tag.href.indexOf(hw.tagUrl) == 0) {
            tag.href = hw.tagUrl + hw.text(tag);
          }
        }, 0);

        // cache all other letters, up to 100 in the history
        hw.wysiwygLastKeys += String.fromCharCode(key);
        hw.wysiwygLastKeys = hw.wysiwygLastKeys.slice(-100);
        // don't keep everything in memory
        break;
    }
  }

  if (!isComment) {
    setTimeout(hw.htmlPreview, 100);
  }
};

hw.selection = 0;
hw.saveSelection = function(event) {
  var wysiwygResult = hw.getCurrentWysiwyg();
  if (!wysiwygResult) {
    return;
  }

  if (window.getSelection) {
    var sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      hw.selection = sel.getRangeAt(0);
    }
  } else if (document.selection && document.selection.createRange) {
    hw.selection = document.selection.createRange();
  } else {
    hw.selection = null;
  }

  hw.wysiwygDetectState();

  if (event) {
    hw.wysiwygCheckImageClick(event);
  }
};

hw.mainSaveSelection = function() {
  if (!hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  hw.saveSelection();
};

hw.mainRestoreSelection = function() {
  if (!hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  hw.restoreSelection();
};

hw.restoreSelection = function() {
  if (hw.selection) {
    if (window.getSelection) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(hw.selection);
    } else if (document.selection && hw.selection.select) {
      hw.selection.select();
    }
  }
};

hw.getSelectionStartNode = function(allowTextNodes) {
  var node, selection;
  if (window.getSelection) {
    selection = window.getSelection();
    node = selection.anchorNode;
  }
  if (!node && document.selection) { // IE
    selection = document.selection;
    var range = selection.getRangeAt ? selection.getRangeAt(0) :
        selection.createRange();
    node = range.commonAncestorContainer
              ? range.commonAncestorContainer
              : range.parentElement ? range.parentElement() : range.item(0);
  }
  if (node) {
    return (node.nodeName == "#text" && !allowTextNodes ?
        node.parentNode : node);
  }
};

hw.onbeforepaste = function(event) {
  hw.preventDefault(event);
};

// from feedparser.py
hw.acceptable_elements = ['a', 'abbr', 'acronym', 'address', 'area',
        'article', 'aside', 'audio', 'b', 'big', 'blockquote', 'br', 'button',
        'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup',
        'command', 'datagrid', 'datalist', 'dd', 'del', 'details', 'dfn',
        'dialog', 'dir', 'div', 'dl', 'dt', 'em', 'event-source', 'fieldset',
        'figcaption', 'figure', 'footer', 'font', 'form', 'header', 'h1',
        'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'input', 'ins',
        'keygen', 'kbd', 'label', 'legend', 'li', 'm', 'map', 'menu', 'meter',
        'multicol', 'nav', 'nextid', 'ol', 'output', 'optgroup', 'option',
        'p', 'pre', 'progress', 'q', 's', 'samp', 'section', 'select',
        'small', 'sound', 'source', 'spacer', 'span', 'strike', 'strong',
        'sub', 'sup', 'table', 'tbody', 'td', 'textarea', 'time', 'tfoot',
        'th', 'thead', 'tr', 'tt', 'u', 'ul', 'var', 'video', 'noscript'];
hw.acceptable_elements_regex = "";

hw.acceptable_attributes = ['abbr', 'accept', 'accept-charset', 'accesskey',
      'action', 'align', 'alt', 'autocomplete', 'autofocus', 'axis',
      'background', 'balance', 'bgcolor', 'bgproperties', 'border',
      'bordercolor', 'bordercolordark', 'bordercolorlight', 'bottompadding',
      'cellpadding', 'cellspacing', 'ch', 'challenge', 'char', 'charoff',
      'choff', 'charset', 'checked', 'cite', 'class', 'clear', 'color', 'cols',
      'colspan', 'compact', 'contenteditable', 'controls', 'coords', 'data',
      'datafld', 'datapagesize', 'datasrc', 'datetime', 'default', 'delay',
      'dir', 'disabled', 'draggable', 'dynsrc', 'enctype', 'end', 'face', 'for',
      'form', 'frame', 'galleryimg', 'gutter', 'headers', 'height', 'hidefocus',
      'hidden', 'high', 'href', 'hreflang', 'hspace', 'icon', 'id', 'inputmode',
      'ismap', 'keytype', 'label', 'leftspacing', 'lang', 'list', 'longdesc',
      'loop', 'loopcount', 'loopend', 'loopstart', 'low', 'lowsrc', 'max',
      'maxlength', 'media', 'method', 'min', 'multiple', 'name', 'nohref',
      'noshade', 'nowrap', 'open', 'optimum', 'pattern', 'ping', 'point-size',
      'prompt', 'pqg', 'radiogroup', 'readonly', 'rel', 'repeat-max',
      'repeat-min', 'replace', 'required', 'rev', 'rightspacing', 'rows',
      'rowspan', 'rules', 'scope', 'selected', 'shape', 'size', 'span', 'src',
      'start', 'step', 'summary', 'suppress', 'tabindex', 'target', 'template',
      'title', 'toppadding', 'type', 'unselectable', 'usemap', 'urn', 'valign',
      'value', 'variable', 'volume', 'vspace', 'vrml', 'width', 'wrap',
      'xml:lang'];
hw.acceptable_attributes_regex = "";

hw.paste = function(event) {
  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];

  if (!hw.hasClass('hw-container', 'hw-editing') && !isComment) {
    return;
  }

  var createForm = isComment ? hw.$c('hw-comment-form') : hw.$c('hw-create');
  var pasteArea = document.createElement('div');
  pasteArea.setAttribute('class', 'hw-paste-area');
  pasteArea.setAttribute('contenteditable', '');
  pasteArea.style.top = (Math.abs(wysiwyg.getBoundingClientRect().top) + 45) +
      'px';
  pasteArea.style.left = '10px';
  createForm.appendChild(pasteArea);
  pasteArea.focus();

  var postPaste = function() {
    var wysiwygResult = hw.getCurrentWysiwyg();
    var isComment = wysiwygResult['isComment'];
    var wysiwyg = wysiwygResult['wysiwyg'];
    wysiwyg.focus();

    var createForm = isComment ? hw.$c('hw-comment-form') : hw.$c('hw-create');
    var pastedContent = pasteArea.innerHTML;
    createForm.removeChild(pasteArea);

    if (window.clipboardData) {
      pastedContent = window.clipboardData.getData("Text");
    }

    if (pastedContent) {
      if (hw.shiftKeyPressed) {
        if (pastedContent.search(/https?:\/\//ig) == 0) { // links
          pastedContent = '<a href="' + pastedContent + '">' + pastedContent
              + '</a>';
        }
        hw.insertHTML(pastedContent);
        return;
      }

      if (pastedContent.search(/https?:\/\/maps.google.com/ig) == 0) {
        pastedContent = '&lt;iframe width="425" height="350" src="' +
            pastedContent +
            '&output=embed" frameborder="0" allowfullscreen&gt;&lt;/iframe&gt;';
      }

      if (pastedContent.search(/https?:\/\//ig) == 0) { // links
        hw.getEmbedHtml(pastedContent);
        pastedContent = " ";
      } else if (!isComment && pastedContent.search(
          /&lt;(embed|object|iframe)\s/ig) == 0) { // embed code
        pastedContent = pastedContent.replace(/&amp;/g, "&").
            replace(/&lt;/g, "<").replace(/&gt;/g, ">").
            replace(/&quot;/g, "\"");
        pastedContent += '<br><br>';
      } else {
        if (!hw.acceptable_elements_regex) {
          for (var x = 0; x < hw.acceptable_elements.length; ++x) {
            hw.acceptable_elements_regex += (x == 0 ? '' : '|')
                + hw.acceptable_elements[x];
          }
          for (var x = 0; x < hw.acceptable_attributes.length; ++x) {
            hw.acceptable_attributes_regex += (x == 0 ? '' : '|')
                + hw.acceptable_attributes[x];
          }
        }
        // very simple html sanitizer, not meant for xss prevention
        // just to strip annoying styling when pasting
        // remove all but whitelisted tags
        var tagRegex = new RegExp("<(?!\/?(" + hw.acceptable_elements_regex
            + ")(>|\\s+[^>]+))[^>]*>", "ig");
        pastedContent = pastedContent.replace(tagRegex, "");
        // remove all but whitelisted attributes
        var attrRegex = new RegExp("\\s(?!(" + hw.acceptable_attributes_regex
            + "))[^<>=]*=('([^']*)'|\"([^\"]*)\")", "ig");
        pastedContent = pastedContent.replace(attrRegex, "");
      }

      hw.insertHTML(pastedContent);
    }
  };

  setTimeout(postPaste, 0);
};

hw.getEmbedHtml = function(link, opt_img) {
  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];

  var createForm = isComment ? hw.$c('hw-comment-form') : hw.$c('hw-create');

  var callback = function(xhr) {
    var isEmbed = xhr.responseText.search(
        /<(embed|object|iframe|img)\s/ig) != -1;
    hw.insertHTML(xhr.responseText + (isEmbed ? "<br>" : ""));
    if (isEmbed) {
      var via = link.match(/:\/\/([^\.]*)\./)[1];
      if (via == 'www') {
        via = link.match(/:\/\/www.([^\.]*)\./)[1];
      }
      hw.insertHTML('<br>(' + hw.getMsg('via') + ' <a href="' + link + '">' +
          via + '</a>)<br><br><br>');
      hw.modify("move", "forward", "line");
    }

    if (isComment) {
      return;
    }

    if (!createForm['hw-id'].value && xhr.getResponseHeader(
        'X-Helloworld-Thumbnail') && !createForm['hw-thumb'].value) {
      createForm['hw-thumb'].value = xhr.getResponseHeader(
          'X-Helloworld-Thumbnail');
      hw.changeThumbPreview();
    }
    var newTitle = hw.$('hw-new-title');
    if (!createForm['hw-id'].value && xhr.getResponseHeader(
        'X-Helloworld-Title') && newTitle &&
        (hw.text(newTitle) == hw.getMsg('untitled') ||
            hw.text(newTitle) == '')) {
      newTitle.innerHTML = xhr.getResponseHeader('X-Helloworld-Title');
      hw.addClass(newTitle, 'hw-modified-title');
      createForm['hw-title'].value =
          xhr.getResponseHeader('X-Helloworld-Title');
    }
  };
  new hw.ajax(hw.baseUri() + 'api',
    { method: 'post',
      postBody: 'op='   + encodeURIComponent('embed')
             + '&url='  + encodeURIComponent(opt_img || link),
      onSuccess: callback,
      headers: { 'X-Xsrftoken' : createForm['_xsrf'].value } });
};

hw.wysiwyg = function(event, cmd, value, el) {
  hw.preventDefault(event);

  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];

  wysiwyg.focus();
  var skipExec = false;

  if (cmd == "createLink") {
    var startNode = hw.getSelectionStartNode();
    if (startNode.nodeName == 'A') {
      skipExec = true;
      var fragment = document.createDocumentFragment();
      for (var x = 0; x < startNode.childNodes.length; ++x) {
        fragment.appendChild(startNode.childNodes[x]);
      }
      startNode.parentNode.replaceChild(fragment, startNode);
      hw.hideElementOptions();
      return;
    } else {
      if (!hw.selection.toString()) {
        return;
      }
      value = "http://";
    }
  }

  try {
    if (!skipExec) {
      document.execCommand(cmd, false, value);
    }
  } catch(ex) {
    // XXX, formatBlock messes up sometimes
    if (cmd == "formatBlock") {
      var br = document.createElement('br');
      wysiwyg.insertBefore(br, wysiwyg.firstChild);
      var range = document.createRange();
      range.setStart(br, 0);
      document.execCommand(cmd, false, value);
    }
  }

  if (el) {
    hw.setClass(el, 'hw-selected', !hw.hasClass(el, 'hw-selected'));
  }

  hw.wysiwygDetectState();

  if (!isComment) {
    hw.htmlPreview();
  }

  if (cmd == "createLink") {
    var anchorTag = hw.getSelectionStartNode(true).nextSibling;
    hw.showAnchorEditor(anchorTag);
    hw.$c('hw-anchor-link').value = 'http://';
    hw.$c('hw-anchor-visit').href = '';
    hw.$c('hw-anchor-link').focus();
    hw.$c('hw-anchor-link').select();
  }
};

hw.wysiwygDetectState = function() {
  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];

  if (!wysiwyg.hasAttribute('contenteditable')) {
    return;
  }

  wysiwyg.focus();

  var isAnchor = hw.getSelectionStartNode().nodeName == 'A';
  if (isAnchor) {
    hw.showAnchorEditor();
  } else {
    hw.hideAnchorEditor();
  }

  var images = hw.getSelectionStartNode().getElementsByTagName('IMG');
  var isImage = images.length && images[0].parentNode ==
      hw.getSelectionStartNode();  // only look at children, not descendants
  if (isImage) {
    hw.showImageOptions();
  } else {
    hw.hideImageOptions();
  }
};

// XXX this worksaround Chrome not being able to select the image
hw.wysiwygCheckImageClick = function(event) {
  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];

  if (!wysiwyg.hasAttribute('contenteditable') || !event.target) {
    return;
  }

  if (event.target.parentNode.nodeName == 'A') {
    hw.showAnchorEditor(event.target.parentNode);
  }
  if (event.target.nodeName == 'IMG') {
    hw.showImageOptions(event.target);
  }
};

hw.hideElementOptions = function() {
  hw.hideAnchorEditor();
  hw.hideImageOptions();
};

hw.showAnchorEditor = function(anchor) {
  var anchorTag = anchor || hw.getSelectionStartNode();
  if (anchorTag.nodeName != 'A') {
    return;
  }
  hw.$c('hw-anchor-link')['anchorTag'] = anchorTag;
  var anchorPosition = anchorTag.getBoundingClientRect();
  var contentPosition = hw.$('hw-content') ?
      hw.$('hw-content').getBoundingClientRect() :
      document.body.getBoundingClientRect();
  hw.$c('hw-anchor-editor').style.top =
      (window.pageYOffset + 15 + anchorPosition.top) + 'px';
  hw.$c('hw-anchor-editor').style.left =
      (anchorPosition.left + 5 - contentPosition.left) + 'px';
  hw.$c('hw-anchor-link').value = anchorTag.href;
  hw.$c('hw-anchor-visit').href = anchorTag.href;
  hw.$$('[name=hw-anchor-type]')[0].checked =
      anchorTag.href.indexOf('mailto:') != 0;
  hw.$$('[name=hw-anchor-type]')[1].checked =
      anchorTag.href.indexOf('mailto:') == 0;
};

hw.hideAnchorEditor = function() {
  if (hw.$c('hw-anchor-editor')) {
    hw.$c('hw-anchor-editor').style.top = '-10000px';
    hw.$c('hw-anchor-editor').style.left = '-10000px';
  }
};

hw.changeAnchorType = function(el) {
  var link = hw.$c('hw-anchor-link');
  el.checked = true;
  if (el.value == 'web' && link.value.indexOf('mailto:') == 0) {
    hw.$c('hw-anchor-link').value = 'http://';
    hw.$c('hw-anchor-visit').href = '';
    hw.$c('hw-anchor-link').focus();
  } else if (el.value == 'email' && link.value.indexOf('mailto:') != 0) {
    hw.$c('hw-anchor-link').value = 'mailto:';
    hw.$c('hw-anchor-visit').href = '';
    hw.$c('hw-anchor-link').focus();
  }
};

hw.changeAnchorLink = function(el) {
  hw.$c('hw-anchor-visit').href = el.value;

  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];
  wysiwyg.focus();

  var anchorTag = hw.$c('hw-anchor-link')['anchorTag'];
  anchorTag.href = el.value;
};

hw.showImageOptions = function(image) {
  var imageTag;
  if (image) {
    imageTag = image;
  } else {
    imageTag = hw.getSelectionStartNode().getElementsByTagName('IMG')[0];
  }
  var figureTag = imageTag.parentNode.nodeName == 'FIGURE' ?
      imageTag.parentNode :
      (imageTag.parentNode.parentNode.nodeName == 'FIGURE' ?
      imageTag.parentNode.parentNode : null);
  var caption = null;
  if (figureTag) {
    var captions = figureTag.getElementsByTagName('FIGCAPTION');
    if (!captions.length) {
      caption = document.createElement('FIGCAPTION');
      var div = document.createElement('DIV');
      // mozilla doesn't like editing in just the figcaption
      div.appendChild(document.createTextNode(hw.getMsg('image-info')));
      caption.appendChild(div);
      figureTag.appendChild(caption);
    } else {
      caption = captions[0];
    }
  }
  var anchorPosition = hw.$c('hw-anchor-editor').getBoundingClientRect();
  var anchorEditorShown = anchorPosition.top >= 0;
  hw.$c('hw-image-options')['imageTag'] = imageTag;
  hw.$c('hw-image-options')['captionTag'] = caption;
  var imagePosition = imageTag.getBoundingClientRect();
  var contentPosition = hw.$('hw-content') ?
      hw.$('hw-content').getBoundingClientRect() :
      document.body.getBoundingClientRect();
  hw.$c('hw-image-options').style.top = (window.pageYOffset
      + (anchorEditorShown ?
      anchorPosition.top + anchorPosition.height + 25 :
      imagePosition.top + 110)) + 'px';
  hw.$c('hw-image-options').style.left =
      (imagePosition.left + 5 - contentPosition.left) + 'px';
  hw.$$('[name=hw-image-align]')[0].checked =
      imageTag.style.cssFloat == '' || imageTag.style.cssFloat == 'none';
  hw.$$('[name=hw-image-align]')[1].checked =
      imageTag.style.cssFloat == 'left';
  hw.$$('[name=hw-image-align]')[2].checked =
      imageTag.style.cssFloat == 'right';
};

hw.hideImageOptions = function() {
  if (hw.$c('hw-image-options')) {
    if (hw.$c('hw-image-options')['captionTag']) {
      if (hw.getSelectionStartNode() == hw.$c('hw-image-options')['captionTag']
          || hw.getSelectionStartNode() ==
          hw.$c('hw-image-options')['captionTag'].firstChild) {
        return;
      }
      if (hw.text(hw.$c('hw-image-options')['captionTag']).
          replace(/\W/g, '') == hw.getMsg('image-info')) {
        hw.$c('hw-image-options')['captionTag'].parentNode.
            removeChild(hw.$c('hw-image-options')['captionTag']);
        hw.$c('hw-image-options')['captionTag'] = null;
      }
    }
    hw.$c('hw-image-options').style.top = '-10000px';
    hw.$c('hw-image-options').style.left = '-10000px';
  }
};

hw.changeImageAlign = function(el) {
  el.checked = true;

  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];

  wysiwyg.focus();
  var imageTag = hw.$c('hw-image-options')['imageTag'];
  imageTag.style.cssFloat = el.value;
  imageTag.style.margin = el.value == 'left' ? '10px' :
      (el.value == 'right' ? '10px' : '');

  var highestElement = imageTag;

  if (imageTag.parentNode.nodeName == 'A') {
    imageTag.parentNode.style.cssFloat = el.value;
    highestElement = imageTag.parentNode;

    if (imageTag.parentNode.parentNode.nodeName == 'FIGURE') {
      imageTag.parentNode.parentNode.style.cssFloat = el.value;
      highestElement = imageTag.parentNode.parentNode;
    }
  }

  /*var next = hw.nextSiblingNonText(highestElement);
  if (!next || !hw.hasClass(next, 'clear')) {
    var regular = document.createElement('DIV');
    regular.innerHTML = '<br>';
    var clear = document.createElement('DIV');
    clear.className = 'clear';
    if (next) {
      highestElement.parentNode.insertBefore(regular, next);
      highestElement.parentNode.insertBefore(clear, next);
    } else {
      highestElement.parentNode.appendChild(regular);
      highestElement.parentNode.appendChild(clear);
    }
  }*/
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
    posx = event.clientX + document.body.scrollLeft +
        document.documentElement.scrollLeft;
    posy = event.clientY + document.body.scrollTop  +
        document.documentElement.scrollTop;
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
    hw.dragEl.parentNode.style.left =
        (hw.dragOffsetX + pos[0] - hw.dragMouseX) + 'px';
    hw.dragEl.parentNode.style.top  =
        (hw.dragOffsetY + pos[1] - hw.dragMouseY) + 'px';
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



hw.processFiles = function(json) {
  var wysiwygResult = hw.getCurrentWysiwyg();
  var isComment = wysiwygResult['isComment'];
  var wysiwyg = wysiwygResult['wysiwyg'];
  var createForm = isComment ? hw.$c('hw-comment-form') : hw.$c('hw-create');
  wysiwyg.focus();

  hw.insertHTML(json['html'] + "<br><br>");
  hw.modify("move", "forward", "line");

  if (isComment) {
    return;
  }

  hw.htmlPreview();

  if (json['thumb_url'] && !createForm['hw-thumb'].value) {
    createForm['hw-thumb'].value = json['thumb_url'];
    hw.changeThumbPreview();
  }
};

hw.commentUploadButton = function() {
  if (hw.$c('hw-comment-upload-wrapper')) {
    hw.uploadButton(function(json) { hw.processFiles(json); }, null, false,
        true, hw.$c('hw-comment-upload-wrapper'));
  }
};

hw.uploadButton = function(callback, section, opt_drop, opt_isComment,
    opt_attachToWrapper) {
  section = section || "";
  var buttonHtml =
      '<a name="hw-button-media" class="hw-button hw-button-media" data-section="' + section + '">+</a>'
    + '<progress value="0" max="100" class="hw-hidden">0%</progress>'
    + '<span class="hw-media-result hw-invisible hw-invisible-transition"></span>';
  if (opt_attachToWrapper) {
    opt_attachToWrapper.innerHTML = buttonHtml;
  } else {
    document.write(buttonHtml);
  }
  var commentSelector = opt_isComment ? '.hw-comment-form ' : '';
  var buttons = hw.$$(commentSelector + '.hw-button-media');
  var button = buttons[buttons.length - 1];
  var progress = button.nextSibling;
  var result = progress.nextSibling;
  var xsrf = hw.$$(commentSelector + 'input[name=_xsrf]')[0].value;

  function displayResponse(good, msg) {
    hw.show(result);
    hw.setClass(result, 'hw-bad', !good);
    result.innerHTML = msg;
    var callback = function() {
      hw.hide(result);
    };
    setTimeout(callback, 3000);
  };

  if (!opt_isComment) {
    var r = new Resumable({
      target: hw.uploadUrl, 
      query: { 'section': encodeURIComponent(section),
               '_xsrf' : encodeURIComponent(xsrf) }
    });
  }

  // Resumable.js isn't supported, fall back on a different method
  if (opt_isComment || !r.support) {
    var iframe = document.createElement('iframe');
    var child = button.parentNode.appendChild(iframe);
    iframe.src = 'about:blank';
    iframe.setAttribute('name', 'hw-media-creator');
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '16');
    iframe.setAttribute('class', 'hw-hidden');

    var onUpload = function() {
      Event.stopObserving(iframe, 'load', onUpload, false);

      var doc = iframe.contentWindow.document;
      var body = doc.body;

      var bad = false;
      var json;
      try {
        json = JSON.parse(hw.text(body));
      } catch(ex) {
        bad = true;
      }

      if (bad) {
        displayResponse(false, hw.getMsg('error'));
      } else {
        displayResponse(true, hw.getMsg('saved'));
        callback(json);
      }

      fn();
    };

    var fn = function() {
      var doc = iframe.contentWindow.document;
      var body = doc.body;
      body.innerHTML = '<form id="form" method="post" action="'
          + hw.uploadUrl + '" enctype="multipart/form-data">'
          + hw.xsrf
          + '<input id="section" type="hidden" name="section" value="'
          + section + '">'
          + '<input id="file" name="file" type="file" multiple="multiple" onchange="this.form.submit()">'
          + '</form>';

      Event.stopObserving(iframe, 'load', fn, false);
      Event.observe(iframe, 'load', onUpload, false);

      hw.show(button);
      result.innerHTML = "";

      var clickFunc = function() {
        doc.getElementById('section').value =
            button.getAttribute('data-section');
        doc.getElementById('file').click();
        //hw.hide(button);
        hw.show(result);
        result.innerHTML = hw.getMsg('uploading');
      };

      button.onclick = clickFunc;
    };
    Event.observe(iframe, 'load', fn, false);

    return;
  }

  r.assignBrowse(button);

  if (opt_drop) {
    r.assignDrop(document);
    var dragFileTimeout;
    Event.observe(document, 'dragover', function(event) {
      if (!hw.hasClass('hw-container', 'hw-editing') ||
          (event.dataTransfer.getData('text/plain') ||
          hw.dragChromeWorkaroundId ||
          event.dataTransfer.types[0] != "Files")) {
        return;
      }

      if (!opt_isComment) {
        document.body.scrollTop = 0;
      }
      hw.addClass(document.body, 'hw-dragging-file');
      clearTimeout(dragFileTimeout);
      dragFileTimeout = setTimeout(function() {
        hw.removeClass(document.body, 'hw-dragging-file');
      }, 250);
    }, false);
  }

  var resumableObj = null;

  r.on('fileAdded', function(file) {
    resumableObj = file.resumableObj;
    resumableObj.opts.query['section'] = button.getAttribute('data-section');
    file.resumableObj.upload();
    hw.show(progress);
    hw.hide(button);
    hw.hide(result);
    result.innerHTML = "";
    setTimeout(function() {
      hw.removeClass(document.body, 'hw-dragging-file');
    }, 0);
  });
  r.on('fileSuccess', function(file, msg) {
    var json = JSON.parse(msg);
    callback(json);
  });

  r.on('complete', function() {
    resumableObj.files = [];
    hw.show(button);
    hw.hide(progress);
    progress.setAttribute('value', '0');
    progress.innerHTML = '0%';
    displayResponse(true, hw.getMsg('saved'));
  });
  r.on('error', function(message, file) {
    resumableObj.files = [];
    hw.show(button);
    hw.hide(progress);
    progress.setAttribute('value', '0');
    progress.innerHTML = '0%';
    displayResponse(false, hw.getMsg('error'));
  });
  r.on('progress', function() {
    if (!resumableObj) {
      return;
    }

    var percent = resumableObj.progress() * 100;
    progress.setAttribute('value', percent);
    progress.innerHTML = percent + '%';
  });
};
