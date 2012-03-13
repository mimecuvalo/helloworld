hw.inForcedEditPage = false;
hw.edit = function(event, opt_dontCreateMediaIframe) {
  if (event) {
    hw.preventDefault(event);
  }

  var createForm = hw.$c('hw-create');
  var turnEditingOn = hw.isHidden(createForm);

  // if page has code or we've started using the history api...
  if (!hw.inForcedEditPage && (hw.pageHasCode || hw.addedFirstUrlToHistory)) {
    window.location.href = window.location.pathname + '?edit=true';
    return;
  }

  // if on forced edit page, remove it from the url

  // convert code back to normal
  if (hw.createAutoload && hw.inForcedEditPage && hw.pageHasCode) {
    hw.editScriptWorkaround();
  }

  hw.createAutoload = false;

  // XXX, edge case: if you edit the page, then click 'edit' to close edit mode (without saving),
  // then, navigate to a neighbor page (which uses html5 history) you don't get
  // the onbeforeunload call for the page you were editing.
  // therefore, show force onbeforeunload to show up
  if (!turnEditingOn && window.onbeforeunload && !hw.inForcedEditPage) {
    window.location.reload();
    return;
  }

  hw.setClass('hw-edit', 'hw-selected', turnEditingOn);
  if (hw.$('hw-container')) {
    hw.setClass('hw-container', 'hw-editing', turnEditingOn);
  }
  hw.display(createForm, turnEditingOn);
  if (!turnEditingOn) {
    hw.hideElementOptions();
  }
  createForm['hw-save'].disabled = false;
  var wysiwyg = hw.$c('hw-wysiwyg');

  if (hw.createIndividualContent) {
    if (turnEditingOn) {
      if (!opt_dontCreateMediaIframe) {
        hw.createMediaIframe();
      }
      if (!wysiwyg.innerHTML.match(/<br>$/g)) {
        wysiwyg.innerHTML += "<br>";
      }
      wysiwyg.setAttribute('contenteditable', '');
    } else {
      wysiwyg.removeAttribute('contenteditable');
    }
  } else {
    hw.options();
    setTimeout(hw.setupCodeMirror, 0);
  }

  return false;
};

hw.editScriptWorkaround = function() {
  var wysiwyg = hw.$c('hw-wysiwyg');
  document.head.innerHTML = document.head.innerHTML.replace(/<style name="HWSCRIPTWORKAROUND"/g, '<script');
  document.head.innerHTML = document.head.innerHTML.replace(/<\/style><!--HWSCRIPTWORKAROUND-->/g, '</script>');
  wysiwyg.innerHTML = wysiwyg.innerHTML.replace(/<style name="HWSCRIPTWORKAROUND"/g, '<script');
  wysiwyg.innerHTML = wysiwyg.innerHTML.replace(/<\/style><!--HWSCRIPTWORKAROUND-->/g, '</script>');
};

// TODO: use ace editor? has wrapping at least...
// also has basic Vim emulation which could be extended for das geeks
// another example of vi emulation: http://gpl.internetconnection.net/vi/
hw.cm = null;
hw.setupCodeMirror = function() {
  if (hw.$c('hw-style-cm')) {
    return;
  }

  var onChange = function(editor) {
    editor.save();
    hw.htmlPreview(true, true);
  };

  var cm = CodeMirror.fromTextArea(hw.$c('hw-style'), { mode: "css", lineNumbers: true, matchBrackets: true, onChange: onChange });
  cm.getWrapperElement().setAttribute('name', 'hw-style-cm');
  hw.addClass(cm.getWrapperElement(), 'hw-style-cm');
  cm.getWrapperElement().cm = cm;
  if (hw.createIndividualContent) {
    hw.hide(cm.getWrapperElement());
  }
  Event.observe(hw.$c('hw-style-cm'), 'keydown', hw.shortcuts, false);

  cm = CodeMirror.fromTextArea(hw.$c('hw-code'), { mode: "javascript", lineNumbers: true, matchBrackets: true, onChange: onChange });
  cm.getWrapperElement().setAttribute('name', 'hw-code-cm');
  hw.addClass(cm.getWrapperElement(), 'hw-code-cm');
  cm.getWrapperElement().cm = cm;
  hw.hide(cm.getWrapperElement());
  Event.observe(hw.$c('hw-code-cm'), 'keydown', hw.shortcuts, false);

  if (hw.createIndividualContent) {
    hw.$c('hw-html').value = hw.$c('hw-html').value.replace(/>([^\n])/g, '>\n$1');
    hw.cm = CodeMirror.fromTextArea(hw.$c('hw-html'), { mode: "text/html", lineNumbers: true, matchBrackets: true, onChange: onChange });
    hw.cm.getWrapperElement().setAttribute('name', 'hw-html-cm');
    hw.addClass(hw.cm.getWrapperElement(), 'hw-html-cm');
    hw.cm.getWrapperElement().cm = hw.cm;
    //hw.cm.focus();
    Event.observe(hw.$c('hw-html-cm'), 'keydown', hw.shortcuts, false);
  }
};

hw.optionsClick = function(event) {
  hw.preventDefault(event);

  hw.options();
};

hw.options = function(open) {
  var createForm = hw.$c('hw-create');
  var options = hw.$c('hw-options');
  var openOptions = open || hw.isHidden(options);
  hw.html(null, null, !openOptions);
  hw.setClass(hw.$c('hw-more-options'), 'hw-selected', openOptions);
  hw.setClass(createForm, 'hw-options-open', openOptions);
  hw.display(options, openOptions);
  return false;
};

hw.sectionChange = function(section) {
  var createForm = hw.$c('hw-create');

  var oldTemplate = createForm['hw-section-template'].value;
  var newTemplate = '';
  if (section.value == '_new_' || createForm['hw-section-album'].value == '_new_') {
    hw.options(true);
    createForm['hw-section'].focus();
    createForm['hw-section'].select();
  } else if (section.value) {
    var section = createForm['hw-section-album'];
    var values = createForm['hw-section-album'].value.split('|');
    createForm['hw-section'].value = values[0];
    createForm['hw-album'].value = values[1] ? values[1] : '';
    createForm['hw-hidden'].checked = section.options[section.selectedIndex].getAttribute('data-hidden') == 'true';
    createForm['hw-section-template'].value = values[3] ? values[3] : (values[2] ? values[2] : '');
    newTemplate = createForm['hw-section-template'].value;
  }

  hw.templateChange(oldTemplate, newTemplate);
};

hw.templateChange = function(oldTemplate, newTemplate) {
  if (!oldTemplate) {
    oldTemplate = hw.$c('hw-template').getAttribute('data-previous');
  }
  hw.removeClass(hw.$c('hw-playground'), 'hw-template-' + oldTemplate);
  hw.addClass(hw.$c('hw-playground'), 'hw-template-' + newTemplate);
  hw.removeClass(hw.$c('hw-wysiwyg'), 'hw-template-' + oldTemplate);
  hw.addClass(hw.$c('hw-wysiwyg'), 'hw-template-' + newTemplate);
  hw.removeClass(hw.$c('hw-create'), 'hw-template-' + oldTemplate);
  hw.addClass(hw.$c('hw-create'), 'hw-template-' + newTemplate);

  hw.$c('hw-template').setAttribute('data-previous', newTemplate)
};

hw.wysiwygKeymap = {
  9:  'insertUnorderedList',  // tab
  33: 'createLink',   // !
  42: 'bold',         // *
  //47: 'italic',       // /
  95: 'underline'     // _
};

hw.wysiwygLastKeys = "";

hw.shortcuts = function(event) {
  var key = event.which || event.keyCode;

  //hw.hideUserAutocomplete();

  switch (key) {
    case 83:   // ctrl-s, save  TODO report bug to ff, messed up with dvorak keyboard
      if (hw.testAccelKey(event)) {
        hw.preventDefault(event);
        hw.save();
        return;
      }
    default:
      break;
  }
};

hw.wysiwygKeys = function(event) {
  var key = event.charCode || event.keyCode || event.which;

  var wysiwyg = hw.$c('hw-wysiwyg');
  if (document.activeElement == wysiwyg) {
    switch (key) {
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
        } else if (hw.wysiwygLastKeys[hw.wysiwygLastKeys.length - 1] == String.fromCharCode(key)) {
          hw.wysiwygLastKeys = "";
        } else {
          hw.preventDefault(event);
          hw.wysiwygLastKeys += String.fromCharCode(key);
        }
        break;

      case 32:  // space
        // auto-tag things
        setTimeout(function() {
          var hashIndex = hw.wysiwygLastKeys.lastIndexOf('#');
          if (hashIndex == -1) {
            hw.wysiwygLastKeys = "";
            return;
          }

          var sel = window.getSelection();
          var charsBack = hw.wysiwygLastKeys.length - hashIndex;
          sel.modify("move", "backward", "character");
          for (var x = 0; x < charsBack; ++x) {
            sel.modify("extend", "backward", "character");
          }
          var tag = hw.wysiwygLastKeys.substring(hashIndex + 1);

          document.execCommand("createLink", false, hw.tagUrl + tag);

          sel.modify("move", "forward", "character");
          sel.modify("move", "forward", "character");

          hw.wysiwygLastKeys = "";
        }, 0);
        break;

      //case 64:    // @-symbol, autocomplete remote_user
      //  hw.showUserAutocomplete();
      //  break;
      case 45: // -
        if (hw.wysiwygLastKeys.slice(-2) == "--") {
          hw.preventDefault(event);
          var sel = window.getSelection();
          for (var x = 0; x < 2; ++x) {
            sel.modify("extend", "backward", "character");
          }
          document.execCommand("insertHTML", false, '<hr>');
          hw.wysiwygLastKeys = "";
        } else if (hw.wysiwygLastKeys.slice(-5) == "-more") {
          hw.preventDefault(event);
          var sel = window.getSelection();
          for (var x = 0; x < 5; ++x) {
            sel.modify("extend", "backward", "character");
          }
          document.execCommand("insertHTML", false, '<img class="hw-read-more" src="/helloworld/static/img/pixel.gif?v=df3e5">');
          hw.wysiwygLastKeys = "";
        } else {
          hw.wysiwygLastKeys += String.fromCharCode(key);
        }
        break;

      default:
        // modify existing tags
        setTimeout(function() {
          var tag = hw.getSelectionStartNode();
          if (tag.nodeName == 'A' && tag.href.indexOf(hw.tagUrl) == 0) {
            tag.href = hw.tagUrl + tag.textContent;
          }
        }, 0);

        // cache all other letters, up to 100 in the history
        hw.wysiwygLastKeys += String.fromCharCode(key);
        hw.wysiwygLastKeys = hw.wysiwygLastKeys.slice(-100);  // don't keep everything in memory
        break;
    }
  }

  setTimeout(hw.htmlPreview, 100);
};

hw.paste = function(event) {
  if (!hw.hasClass('hw-container', 'hw-editing')) {
    return;
  }

  var wysiwyg = hw.$c('hw-wysiwyg');
  document.execCommand("insertHTML", false, "<br>"); // if there's something currently selected, delete it now
  var original = wysiwyg.innerHTML;

  var postPaste = function() {
    var current = wysiwyg.innerHTML;

    if (original == current) {
      return;
    }

    var pastedContent = "";
    var diffStart = -1;
    for (var x = 0; x < current.length; ++x) {
      if (original == current.substring(0, diffStart) + current.substring(x)) {
        break;
      }
      if (original[x] != current[x] || diffStart != -1) {
        if (diffStart == -1) {
          diffStart = x;

          if (x != 0 && original[x - 1] == '<') { // make sure we get that first < in there
            diffStart = x - 1;
            pastedContent += original[x - 1];
          }
        }
        pastedContent += current[x];
      }
    }

    if (pastedContent) {
      var sel = window.getSelection();
      var div = document.createElement('DIV');
      div.innerHTML = pastedContent;
      hw.$c('hw-view').style.overflow = 'hidden';
      wysiwyg.style.width = '1000000px';  // XXX workaround crappy Firefox bug that includes '\n' in selection when wrapping...todo file bug.
      for (var x = 0; x < div.textContent.length + 1; ++x) {
        sel.modify("extend", "backward", "character");
      }
      wysiwyg.style.width = '';
      hw.$c('hw-view').style.overflow = '';

      if (pastedContent.search(/https?:\/\/maps.google.com/ig) == 0) {
        pastedContent = '&lt;iframe width="425" height="350" src="' + pastedContent + '&output=embed" frameborder="0" allowfullscreen&gt;&lt;/iframe&gt;';
      }

      if (pastedContent.search(/https?:\/\//ig) == 0) { // links
        var createForm = hw.$c('hw-create');
        var callback = function(xhr) {
          document.execCommand("insertHTML", false, xhr.responseText + "<br><br>");
          sel.modify("move", "forward", "character");

          if (!createForm['hw-id'].value && xhr.getResponseHeader('X-Helloworld-Thumbnail') && !createForm['hw-thumb'].value) {
            createForm['hw-thumb'].value = xhr.getResponseHeader('X-Helloworld-Thumbnail');
            hw.changeThumbPreview();
          }
        };
        new hw.ajax(hw.baseUri() + 'api',
          { method: 'post',
            postBody: 'op='   + encodeURIComponent('embed')
                   + '&url='  + encodeURIComponent(pastedContent),
            onSuccess: callback,
            headers: { 'X-Xsrftoken' : createForm['_xsrf'].value } });
        pastedContent = " ";
      } else if (pastedContent.search(/&lt;(embed|object|iframe)\s/ig) == 0) { // embed code
        pastedContent = pastedContent.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"");
        pastedContent += '<br><br>';
      } else {
        // very simple html sanitizer, not meant for xss prevention
        // just to strip annoying styling when pasting
        pastedContent = pastedContent.replace(/<(?!\/?(a|b|br|strong|em)(>|\s+[^>]+))[^>]*>/ig, ""); // remove all but whitelisted tags
        pastedContent = pastedContent.replace(/\s(?!(href))[^<>=]*=('([^']*)'|"([^"]*)")/ig, ""); // remove all but whitelisted attributes
      }

      document.execCommand("insertHTML", false, pastedContent);
    }
  };

  setTimeout(postPaste, 0);
};

hw.wysiwyg = function(event, cmd, value, el) {
  hw.preventDefault(event);

  var wysiwyg = hw.$c('hw-wysiwyg');
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
  hw.htmlPreview();

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
  var wysiwyg = hw.$c('hw-wysiwyg');

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
  var isImage = images.length && images[0].parentNode == hw.getSelectionStartNode();  // only look at children, not descendants
  if (isImage) {
    hw.showImageOptions();
  } else {
    hw.hideImageOptions();
  }
};

hw.hideElementOptions = function() {
  hw.hideUserAutocomplete();
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
  var contentPosition = hw.$('hw-content') ? hw.$('hw-content').getBoundingClientRect() : document.body.getBoundingClientRect();
  hw.$c('hw-anchor-editor').style.top = (window.pageYOffset + 15 + anchorPosition.top) + 'px';
  hw.$c('hw-anchor-editor').style.left = (anchorPosition.left + 5 - contentPosition.left) + 'px';
  hw.$c('hw-anchor-link').value = anchorTag.href;
  hw.$c('hw-anchor-visit').href = anchorTag.href;
  hw.$$('[name=hw-anchor-type]')[0].checked = anchorTag.href.indexOf('mailto:') != 0;
  hw.$$('[name=hw-anchor-type]')[1].checked = anchorTag.href.indexOf('mailto:') == 0;
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
  var wysiwyg = hw.$c('hw-wysiwyg');
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
  hw.$c('hw-image-options')['imageTag'] = imageTag;
  var imagePosition = imageTag.getBoundingClientRect();
  var contentPosition = hw.$('hw-content') ? hw.$('hw-content').getBoundingClientRect() : document.body.getBoundingClientRect();
  hw.$c('hw-image-options').style.top = (window.pageYOffset + imagePosition.top
      + hw.$c('hw-anchor-editor').getBoundingClientRect().height + 25) + 'px';
  hw.$c('hw-image-options').style.left = (imagePosition.left + 5 - contentPosition.left) + 'px';
  hw.$$('[name=hw-image-align]')[0].checked = imageTag.style.cssFloat == '' || imageTag.style.float == 'none';
  hw.$$('[name=hw-image-align]')[1].checked = imageTag.style.cssFloat == 'left';
  hw.$$('[name=hw-image-align]')[2].checked = imageTag.style.cssFloat == 'right';
};

hw.hideImageOptions = function() {
  if (hw.$c('hw-image-options')) {
    hw.$c('hw-image-options').style.top = '-10000px';
    hw.$c('hw-image-options').style.left = '-10000px';
  }
};

hw.changeImageAlign = function(el) {
  el.checked = true;
  var wysiwyg = hw.$c('hw-wysiwyg');
  wysiwyg.focus();
  var imageTag = hw.$c('hw-image-options')['imageTag'];
  imageTag.style.cssFloat = el.value;
  imageTag.style.margin = el.value == 'left' ? '0 22px 11px 0' : (el.value == 'right' ? '0 0 11px 22px' : '');

  if (imageTag.parentNode.nodeName == 'A') {
    imageTag.parentNode.style.cssFloat = el.value;

    if (imageTag.parentNode.parentNode.nodeName == 'FIGURE') {
      imageTag.parentNode.parentNode.style.cssFloat = el.value;
    }
  }
};

hw.showUserAutocomplete = function() {
  if (!hw.remoteUsers) {
    return;
  }

  var node = hw.getSelectionStartNode();
  var users = hw.$c('hw-user-autocomplete');

  var html = "";
  for (var x = 0; x < hw.remoteUsers.length; ++x) {
    html += '<div>' + hw.remoteUsers[x].username + '</div>';
  }
  users.innerHTML = html;

  var contentPosition = hw.$('hw-content') ? hw.$('hw-content').getBoundingClientRect() : hw.$c('hw-wysiwyg').getBoundingClientRect();
  users.style.top = (window.pageYOffset + node.getBoundingClientRect().top + contentPosition.top) + 'px';
  users.style.left = (node.getBoundingClientRect().left + 5) + 'px';
};
hw.hideUserAutocomplete = function() {
  
};

hw.selection = 0;
hw.saveSelection = function() {
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
    var range = selection.getRangeAt ? selection.getRangeAt(0) : selection.createRange();
    node = range.commonAncestorContainer
              ? range.commonAncestorContainer
              : range.parentElement ? range.parentElement() : range.item(0);
  }
  if (node) {
    return (node.nodeName == "#text" && !allowTextNodes ? node.parentNode : node);
  }
};

hw.html = function(event, el, close) {
  if (event) {
    hw.preventDefault(event);
  }

  if (!close) {
    hw.mediaLibrary(null, null, true);
  }

  var wysiwyg = hw.$c('hw-wysiwyg');
  var htmlWrapper = hw.$c('hw-html-wrapper');
  var openHTML = close ? false : hw.isHidden(htmlWrapper);
  var createForm = hw.$c('hw-create');
  hw.setClass(createForm, 'hw-html-open', openHTML);
  hw.display(htmlWrapper, openHTML);
  hw.htmlPreview();
  var fn = function() { hw.createOnScroll(); };
  setTimeout(fn, 300);
  hw.hideElementOptions();

  setTimeout(hw.setupCodeMirror, 0);
};

hw.htmlTab = function(el) {
  var child = hw.$c('hw-html-wrapper').firstChild;
  var tabName = el.getAttribute('name');
  while (child) {
    if (child.nodeName != "TEXTAREA" && child.nodeName != "DIV") {
      child = child.nextSibling;
      continue;
    }
    hw.display(child, tabName.split('-')[1] == child.getAttribute('name').split('-')[1]);
    if (child.cm) {
     child.cm.refresh(); 
    }
    child = child.nextSibling;
  }

  var child = hw.$c('hw-html-tabs').firstChild;
  while (child) {
    if (child.nodeName != "LI") {
      child = child.nextSibling;
      continue;
    }
    hw.setClass(child, 'hw-selected', tabName == child.getAttribute('name'));
    child = child.nextSibling;
  }
};

hw.htmlPreview = function(force, codeMirror) {
  var createForm = hw.$c('hw-create');
  var html = hw.$c('hw-html');
  var htmlCM = hw.$c('hw-html-cm');
  var htmlCMTextarea = htmlCM ? htmlCM.getElementsByTagName('textarea')[0] : null;
  var style = hw.$c('hw-style');
  var styleCM = hw.$c('hw-style-cm');
  var styleCMTextarea = styleCM ? styleCM.getElementsByTagName('textarea')[0] : null;
  var code = hw.$c('hw-code');
  var codeCM = hw.$c('hw-code-cm');
  var codeCMTextarea = codeCM ? codeCM.getElementsByTagName('textarea')[0] : null;
  var wysiwyg = hw.$c('hw-wysiwyg');
  var htmlWrapper = hw.$c('hw-html-wrapper');

  hw.changeBeforeUnloadState();

  if (!force && hw.isHidden(hw.$c('hw-html-wrapper'))) {
    return;
  }

  if (codeMirror && document.activeElement != htmlCMTextarea
                 && document.activeElement != styleCMTextarea
                 && document.activeElement != codeCMTextarea) {
    return;
  }

  if (document.activeElement == html || document.activeElement == htmlCMTextarea) {
    wysiwyg.innerHTML = html.value;
  } else if (document.activeElement != styleCMTextarea && document.activeElement != codeCMTextarea) {
    if (html && !hw.isHidden(htmlWrapper)) {
      html.value = wysiwyg.innerHTML;
      // hmm, this was supposed to help in formatting the html but it ends up being annoying...
      // html.value.replace(/>([^\n])/g, '>\n$1')
      if (hw.cm) {
        hw.cm.setValue(html.value);
      }
    }
  }

  if (document.activeElement == wysiwyg) {
    return;
  }

  if (!hw.$('hw-preview-style')) {
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.id = 'hw-preview-style';
    document.getElementsByTagName('head')[0].appendChild(styleElement);
  }

  var styleElement = hw.$('hw-content-style') ? hw.$('hw-content-style') : hw.$('hw-preview-style');
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = style.value;
   } else {
    styleElement.innerHTML = style.value;
  }

  var jsCode = code.value;
  var jsPattern = "<script[^>]*src=['\"]([^>]*)['\"]></script>";
  var jsRe = new RegExp(jsPattern, "ig");
  var jsSingleRe = new RegExp(jsPattern, "i");
  var jsExternalScripts = jsCode.match(jsRe);
  jsCode = jsCode.replace(jsRe, '');
  if (jsExternalScripts) {
    for (var x = 0; x < jsExternalScripts.length; ++x) {
      var jsSource = jsExternalScripts[x].match(jsSingleRe)[1];
      var existingRe = new RegExp("<script[^>]*src=['\"]" + jsSource + "['\"]></script>", "ig");
      if (document.head.innerHTML.match(existingRe)) {
        continue;
      }
      var scriptElement = document.createElement('script');
      scriptElement.src = jsSource;
      document.getElementsByTagName('head')[0].appendChild(scriptElement);
    }
  }

  jsCode = jsCode.replace('<script>', '');
  jsCode = jsCode.replace('</script>', '');

  try {
    eval(jsCode);
  } catch(ex) {
    return;
  }

  if (hw.$('hw-preview-script')) {
    document.getElementsByTagName('head')[0].removeChild(hw.$('hw-preview-script'));
  }

  var scriptElement = document.createElement('script');
  scriptElement.text = jsCode;
  scriptElement.id = 'hw-preview-script';
  document.getElementsByTagName('head')[0].appendChild(scriptElement);
};

hw.createOnScroll = function(event) {
  var text = hw.$c('hw-wysiwyg-controls');
  var makeTextFixed = hw.$c('hw-wysiwyg').getBoundingClientRect().top - text.getBoundingClientRect().height < 0
               && text.getBoundingClientRect().height < hw.$c('hw-view').getBoundingClientRect().bottom;
  hw.setClass(text, 'hw-fixed', makeTextFixed);
  /*var marginTop = 0;
  if (makeFixed) {
    marginTop = (hw.$c('hw-text').getBoundingClientRect().height - 2) + 'px';
  }
  hw.$c('hw-wysiwyg').style.marginTop = marginTop;*/
  hw.setClass(hw.$('hw-container'), 'hw-fixed', makeTextFixed);
};

hw.changeThumbPreview = function() {
  var thumb = hw.$c('hw-thumb');
  var thumbPreview = hw.$c('hw-thumb-preview');
  if (!thumbPreview) {
    return;
  }
  hw.display(thumbPreview, thumb.value);
  if (thumb.value) {
    thumbPreview.src = thumb.value;
  }
};
