hw.inForcedEditPage = false;
hw.edit = function(event) {
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

  // XXX, edge case: if you edit the page, then click 'edit' to close
  // edit mode (without saving),
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
      if (!wysiwyg.innerHTML.match(/<br>$/g)) {
        wysiwyg.innerHTML += "<br>";
      }
      wysiwyg.setAttribute('contenteditable', '');
    } else {
      wysiwyg.removeAttribute('contenteditable');
    }
  } else {
    setTimeout(hw.setupCodeMirror, 0);
  }

  return false;
};

hw.editScriptWorkaround = function() {
  var wysiwyg = hw.$c('hw-wysiwyg');
  try {
    // XXX doesn't work in IE - this whole things is crap anyway...hmmm
    document.head.innerHTML = document.head.innerHTML.replace(
        /<style name="HWSCRIPTWORKAROUND"/g, '<script');
    document.head.innerHTML = document.head.innerHTML.replace(
        /<\/style><!--HWSCRIPTWORKAROUND-->/g, '</script>');
  } catch(ex) {
    // do nothing
  }
  wysiwyg.innerHTML = wysiwyg.innerHTML.replace(
      /<style name="HWSCRIPTWORKAROUND"/g, '<script');
  wysiwyg.innerHTML = wysiwyg.innerHTML.replace(
      /<\/style><!--HWSCRIPTWORKAROUND-->/g, '</script>');
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

  var cm = CodeMirror.fromTextArea(hw.$c('hw-style'),
      { mode: "css", lineNumbers: true, matchBrackets: true,
        onChange: onChange });
  cm.getWrapperElement().setAttribute('name', 'hw-style-cm');
  hw.addClass(cm.getWrapperElement(), 'hw-style-cm');
  cm.getWrapperElement().cm = cm;
  if (hw.createIndividualContent) {
    hw.hide(cm.getWrapperElement());
  }
  Event.observe(hw.$c('hw-style-cm'), 'keydown', hw.shortcuts, false);

  cm = CodeMirror.fromTextArea(hw.$c('hw-code'),
      { mode: "javascript", lineNumbers: true, matchBrackets: true,
        onChange: onChange });
  cm.getWrapperElement().setAttribute('name', 'hw-code-cm');
  hw.addClass(cm.getWrapperElement(), 'hw-code-cm');
  cm.getWrapperElement().cm = cm;
  hw.hide(cm.getWrapperElement());
  Event.observe(hw.$c('hw-code-cm'), 'keydown', hw.shortcuts, false);

  if (hw.createIndividualContent) {
    hw.$c('hw-html').value = hw.$c('hw-html').value.replace(
        />([^\n])/g, '>\n$1');
    hw.cm = CodeMirror.fromTextArea(hw.$c('hw-html'),
        { mode: "text/html", lineNumbers: true, matchBrackets: true,
          onChange: onChange });
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

  if (openOptions) {
    if (document.body.parentNode.scrollTop) {
      document.body.parentNode.scrollTop = document.body.parentNode.scrollTop +
          options.getBoundingClientRect().top - 100;
    } else {
      document.body.scrollTop = document.body.scrollTop +
          options.getBoundingClientRect().top - 100;
    }
  }

  return false;
};

hw.sectionChange = function(section) {
  var createForm = hw.$c('hw-create');

  var oldTemplate = createForm['hw-section-template'].value;
  var newTemplate = '';
  if (section.value == '_new_' ||
      createForm['hw-section-album'].value == '_new_') {
    hw.options(true);
    createForm['hw-section'].focus();
    createForm['hw-section'].select();
  } else if (section.value) {
    var section = createForm['hw-section-album'];
    var values = createForm['hw-section-album'].value.split('|');
    createForm['hw-section'].value = values[0];
    createForm['hw-album'].value = values[1] ? values[1] : '';
    createForm['hw-hidden'].checked =
        section.options[section.selectedIndex].getAttribute(
        'data-hidden') == 'true';
    createForm['hw-section-template'].value = values[3] ?
        values[3] : (values[2] ? values[2] : '');
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

  hw.$c('hw-template').setAttribute('data-previous', newTemplate);

  hw.display(hw.$c('hw-sort-type-row'), newTemplate != 'feed');
  hw.display(hw.$c('hw-sort-type-input'), newTemplate != 'feed');
};

hw.shortcuts = function(event) {
  var key = event.which || event.keyCode;

  switch (key) {
    // ctrl-s, save  TODO report bug to ff, messed up with dvorak keyboard
    case 83:
      if (hw.testAccelKey(event)) {
        hw.preventDefault(event);
        hw.save();
        return;
      }
    default:
      break;
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

  var contentPosition = hw.$('hw-content') ?
      hw.$('hw-content').getBoundingClientRect() : hw.$c('hw-wysiwyg').
          getBoundingClientRect();
  users.style.top = (window.pageYOffset + node.getBoundingClientRect().top +
      contentPosition.top) + 'px';
  users.style.left = (node.getBoundingClientRect().left + 5) + 'px';
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
  var openHTML = close != undefined ? !close : hw.isHidden(htmlWrapper);
  var createForm = hw.$c('hw-create');
  hw.setClass(createForm, 'hw-html-open', openHTML);
  hw.setClass(hw.$('hw-container'), 'hw-html-open', openHTML);
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
    hw.display(child, tabName.split('-')[1] ==
        child.getAttribute('name').split('-')[1]);
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
  var htmlCMTextarea = htmlCM ?
      htmlCM.getElementsByTagName('textarea')[0] : null;
  var style = hw.$c('hw-style');
  var styleCM = hw.$c('hw-style-cm');
  var styleCMTextarea = styleCM ?
      styleCM.getElementsByTagName('textarea')[0] : null;
  var code = hw.$c('hw-code');
  var codeCM = hw.$c('hw-code-cm');
  var codeCMTextarea = codeCM ?
      codeCM.getElementsByTagName('textarea')[0] : null;
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

  if (document.activeElement == html ||
      document.activeElement == htmlCMTextarea) {
    wysiwyg.innerHTML = html.value;
  } else if (document.activeElement != styleCMTextarea &&
      document.activeElement != codeCMTextarea) {
    if (html && !hw.isHidden(htmlWrapper)) {
      html.value = wysiwyg.innerHTML;
      // hmm, this was supposed to help in formatting the html but it
      // ends up being annoying...
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

  var styleElement = hw.$('hw-content-style') ? hw.$('hw-content-style') :
      hw.$('hw-preview-style');
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
      var existingRe = new RegExp("<script[^>]*src=['\"]" + jsSource +
          "['\"]></script>", "ig");
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
    document.getElementsByTagName('head')[0].removeChild(
        hw.$('hw-preview-script'));
  }

  var scriptElement = document.createElement('script');
  scriptElement.text = jsCode;
  scriptElement.id = 'hw-preview-script';
  document.getElementsByTagName('head')[0].appendChild(scriptElement);
};

hw.createOnScroll = function(event) {
  var text = hw.$c('hw-wysiwyg-controls');
  var makeTextFixed = hw.$c('hw-wysiwyg').getBoundingClientRect().top -
      text.getBoundingClientRect().height < 0
               && text.getBoundingClientRect().height < hw.$c('hw-view').
               getBoundingClientRect().bottom;
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
