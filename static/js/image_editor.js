hw.editImage = function(event, el) {
  hw.preventDefault(event);

  var editor = hw.$c('hw-image-editor');
  editor.__hw_image = hw.$c('hw-media-preview', el.ownerDocument);
  editor.__hw_media_doc = el.ownerDocument;

  if (!hw.hasClass(hw.$c('hw-media-creator', el.ownerDocument), 'hw-file')) {
    return;
  }

  hw.show(editor);
  editor.style.left = editor.getBoundingClientRect().left + 'px';
  editor.style.top = editor.getBoundingClientRect().top + 'px';
  editor.style.marginLeft = 0;

  var img = hw.$c('hw-image-scratch');
  if (!img) {
    var canvas = hw.editImageCanvas();
    Pixastic.revert(canvas);
    img = hw.$c('hw-image-scratch');

    var parentNode = img.parentNode;
    parentNode.removeChild(img);
    var newImg = document.createElement('img');
    hw.addClass(newImg, 'hw-image-scratch');
    parentNode.appendChild(newImg);
    img = newImg;
  }

  img.src = editor.__hw_image.src;
  hw.removeClass(hw.$c('hw-image-editor'), 'hw-editing');
  Pixastic.process(img, "rotate", {angle: 0}, hw.editImageResetForm);  // convert to canvas, noop
};
hw.editImageCanvas = function() {
  return hw.$c('hw-image-editor').getElementsByTagName('canvas')[0];
};
hw.editImageSave = function(event) {
  var editor = hw.$c('hw-image-editor');
  var canvas = hw.editImageCanvas();
  var parentNode = editor.__hw_image.parentNode;
  parentNode.removeChild(editor.__hw_image);
  var newImg = document.createElement('img');
  newImg.src = canvas.toDataURL();
  hw.addClass(newImg, 'hw-media-preview');
  parentNode.insertBefore(newImg, parentNode.firstChild);

  var mediaCreator = hw.$c('hw-media-creator', editor.__hw_media_doc);
  var remoteSource = hw.$c('hw-media-remote', editor.__hw_media_doc);
  var fileInput = hw.$c('hw-media-file', editor.__hw_media_doc);

  var fileName;
  if (hw.hasClass(mediaCreator, 'hw-file')) {
    fileName = fileInput.value;
  } else if (!hw.addClass(remoteSource, 'hw-initial')) {
    fileName = remoteSource.value;
  } else {
    fileName = hw.$c('hw-media-local', editor.__hw_media_doc).value;
  }

  remoteSource.value = '';
  hw.addClass(remoteSource, 'hw-initial');

  hw.addClass(mediaCreator, 'hw-file');
  hw.removeClass(fileInput, 'hw-hidden');
  fileInput['file'] = canvas.toBlob ? canvas.toBlob() : canvas.mozGetAsFile(fileName);
  fileInput.value = fileName;

  hw.editImageClose();
};
hw.editImageClose = function(event) {
  if (event) {
    hw.preventDefault(event);
  }
  var editor = hw.$c('hw-image-editor');
  hw.hide(editor);
  editor.style.left = '50%';
  editor.style.top = '36px';
  editor.style.marginLeft = '-450px';
};
hw.editImageRotate = function(event) {
  var temp = hw.$c('hw-image-width').value;
  hw.$c('hw-image-width').value = hw.$c('hw-image-height').value;
  hw.$c('hw-image-width').setAttribute('data-previous', hw.$c('hw-image-width').value);
  hw.$c('hw-image-height').value = temp;
  hw.rangeSet(hw.$c('hw-image-width'), null, hw.$c('hw-image-width').value);

  var canvas = hw.editImageCanvas();
  hw.removeClass(hw.$c('hw-image-editor'), 'hw-editing');
  Pixastic.process(canvas, "rotate", { angle: -90 });
  hw.addClass(hw.$c('hw-image-editor'), 'hw-editing');
  canvas = hw.editImageCanvas();
  var img = document.createElement('img');
  hw.addClass(img, 'hw-image-scratch');
  img.src = canvas.toDataURL();
  canvas.__scratchImage = img;
};
hw.editImageWidth = function(el) {
  var canvas = hw.editImageCanvas();
  var ratio = hw.editImageDidCrop ? hw.$c('hw-image-height').value / hw.$c('hw-image-width').getAttribute('data-previous')
                                  : canvas.__pixastic_org_height / canvas.__pixastic_org_width;
  hw.$c('hw-image-height').value = Math.max(1, parseInt(el.value * ratio));
  hw.$c('hw-image-width').setAttribute('data-previous', el.value);
  hw.editImageProcess();
};
hw.editImageBrightness = function(el) {
  hw.editImageProcess();
};
hw.editImageContrast = function(el) {
  hw.editImageProcess();
};
hw.editImageProcess = function() {
  if (hw.$c('hw-image-preview').checked) {
    hw.editImageRevert(true);
    var canvas = hw.editImageCanvas();
    var scratch = canvas.__scratchImage;
    var resizeOptions = { width: hw.$c('hw-image-width').value, height: hw.$c('hw-image-height').value };
    hw.removeClass(hw.$c('hw-image-editor'), 'hw-editing');
    Pixastic.process(canvas, "resize", resizeOptions);

    canvas = hw.editImageCanvas();
    var brightnessOptions = { brightness: hw.$c('hw-image-brightness').value, contrast: hw.$c('hw-image-contrast').value };
    Pixastic.process(canvas, "brightness", brightnessOptions);
    hw.addClass(hw.$c('hw-image-editor'), 'hw-editing');

    canvas = hw.editImageCanvas();
    canvas.__scratchImage = scratch;
  }
};
hw.editImageCropMode = false;
hw.editImageCropStart = null;
hw.editImageDidCrop = false;
hw.editImageCrop = function() {
  var canvas = hw.editImageCanvas();
  var editor = hw.$c('hw-image-editor');
  hw.editImageCropMode = !hw.editImageCropMode;
  if (hw.$('hw-image-crop-rect')) {
    hw.$('hw-image-crop-rect').parentNode.removeChild(hw.$('hw-image-crop-rect'));
  }
  if (hw.editImageCropMode) {
    Event.observe(canvas, 'mousedown', hw.cropMouseDown, false);
    Event.observe(editor, 'mousemove', hw.cropMouseMove, false);
    Event.observe(canvas, 'mouseup', hw.cropMouseUp, false);
    hw.$c('hw-image-crop').innerHTML = hw.$c('hw-image-crop').getAttribute('data-select-area');
  } else {
    Event.stopObserving(canvas, 'mousedown', hw.cropMouseDown, false);
    Event.stopObserving(editor, 'mousemove', hw.cropMouseMove, false);
    Event.stopObserving(canvas, 'mouseup', hw.cropMouseUp, false);
    hw.$c('hw-image-crop').innerHTML = hw.$c('hw-image-crop').getAttribute('data-crop');
    hw.editImageCropStart = null;
  }
};
hw.cropMouseDown = function(event) {
  hw.editImageCropStart = { top: event.clientY - event.target.getBoundingClientRect().top,
                            left: event.clientX - event.target.getBoundingClientRect().left };
  var editor = hw.$c('hw-image-editor');
  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.height = '1px';
  div.style.width = '1px';
  div.style.top = (event.clientY - editor.getBoundingClientRect().top) + 'px';
  div.style.left = (event.clientX- editor.getBoundingClientRect().left) + 'px';
  div.style.border = '1px dotted gray';
  div.setAttribute('id', 'hw-image-crop-rect');
  hw.$c('hw-image-editor').appendChild(div);
};
hw.cropMouseMove = function(event) {
  if (hw.editImageCropStart) {
    var canvas = hw.editImageCanvas();
    hw.$('hw-image-crop-rect').style.width = (event.clientX - hw.editImageCropStart.left - canvas.getBoundingClientRect().left - 5) + 'px';
    hw.$('hw-image-crop-rect').style.height = (event.clientY - hw.editImageCropStart.top - canvas.getBoundingClientRect().top - 5) + 'px';
  }
};
hw.cropMouseUp = function(event) {
  if (!hw.editImageCropStart) {
    return;
  }

  if (hw.$c('hw-image-width').value > 650) {  // 650 == size of upload resize
    hw.$c('hw-image-width').value = 650;
    hw.editImageWidth(hw.$c('hw-image-width'));
  }

  var canvas = hw.editImageCanvas();
  var options = { rect: { top: hw.editImageCropStart.top, left: hw.editImageCropStart.left,
                          height: event.clientY - hw.editImageCropStart.top - canvas.getBoundingClientRect().top,
                          width: event.clientX - hw.editImageCropStart.left - canvas.getBoundingClientRect().left } };
                          
  hw.removeClass(hw.$c('hw-image-editor'), 'hw-editing');
  Pixastic.process(canvas, "crop", options);
  hw.addClass(hw.$c('hw-image-editor'), 'hw-editing');
  hw.editImageDidCrop = true;
  canvas = hw.editImageCanvas();
  hw.$c('hw-image-width').value = canvas.getBoundingClientRect().width;
  hw.$c('hw-image-width').setAttribute('data-previous', hw.$c('hw-image-width').value);
  hw.$c('hw-image-height').value = canvas.getBoundingClientRect().height;
  hw.rangeSet(hw.$c('hw-image-width'), null, hw.$c('hw-image-width').value);
  hw.$('hw-image-crop-rect').parentNode.removeChild(hw.$('hw-image-crop-rect'));
  var img = document.createElement('img');
  img.src = canvas.toDataURL();
  hw.addClass(img, 'hw-image-scratch');
  canvas.__scratchImage = img;
  hw.editImageCropStart = null;
  hw.editImageCrop();
};
hw.editImageRevert = function(dontResetForm) {
  var canvas = hw.editImageCanvas();
  var didScratchHack = false;
  if (dontResetForm && canvas.__scratchImage) {
    didScratchHack = true;
    var tempImage = canvas.__pixastic_org_image;
    var tempWidth = canvas.__pixastic_org_width;
    var tempHeight = canvas.__pixastic_org_height;
    var tempScratchImage = canvas.__scratchImage;
    canvas.__pixastic_org_image = canvas.__scratchImage;
    canvas.__pixastic_org_width = hw.$c('hw-image-width').value;
    canvas.__pixastic_org_height = hw.$c('hw-image-height').value;
  }
  Pixastic.revert(canvas);
  var img = hw.$c('hw-image-scratch');
  hw.removeClass(hw.$c('hw-image-editor'), 'hw-editing');
  Pixastic.process(img, "rotate", {angle: 0});  // convert to canvas, noop
  hw.addClass(hw.$c('hw-image-editor'), 'hw-editing');

  if (didScratchHack) {
    canvas = hw.editImageCanvas();
    canvas.__pixastic_org_image = tempImage;
    canvas.__pixastic_org_width = tempWidth;
    canvas.__pixastic_org_height = tempHeight;
    canvas.__scratchImage = tempScratchImage;
  }

  if (!dontResetForm) {
    hw.editImageResetForm();
  }
};
hw.editImageResetForm = function() {
  var canvas = hw.editImageCanvas();
  hw.editImageDidCrop = false;
  hw.$c('hw-image-brightness').value = 0;
  hw.$c('hw-image-contrast').value = 0;
  hw.$c('hw-image-width').value = canvas.__pixastic_org_width;
  hw.$c('hw-image-height').value = canvas.__pixastic_org_height;
  hw.$c('hw-image-width').setAttribute('data-previous', canvas.__pixastic_org_width);
  hw.rangeSet(hw.$c('hw-image-brightness'), null, 0);
  hw.rangeSet(hw.$c('hw-image-contrast'), null, 0);
  hw.rangeSet(hw.$c('hw-image-width'), null, canvas.__pixastic_org_width);
  hw.addClass(hw.$c('hw-image-editor'), 'hw-editing');
};
hw.rangeStart = function(event, el) {
  el.setAttribute('data-moving', 'true');
  hw.rangeSet(el, event);
};
hw.rangeMove = function(event, el) {
  if (el.getAttribute('data-moving')) {
    hw.rangeSet(el, event);
  }
};
hw.rangeSet = function(el, event, value) {
  var min = Number(el.getAttribute('min'));
  var max = Number(el.getAttribute('max'));
  var step = Number(el.getAttribute('step'));
  var sliderWidth = 12;
  var x;

  if (event) {
    x = Math.max(0, event.clientX - el.getBoundingClientRect().left - sliderWidth / 2);
    x = Math.min(x, el.getBoundingClientRect().width - sliderWidth);
  } else {
    x = (value - min) / (max - min) * (el.getBoundingClientRect().width - sliderWidth);
  }

  var rawValue = x / (el.getBoundingClientRect().width - sliderWidth) * (max - min) + min;
  rawValue = (rawValue * 1 / step).toFixed(0) * step;
  var fraction = step - parseInt(step);
  if (fraction) {
    rawValue = rawValue.toFixed((1 / fraction / 10).toFixed(0).length + 1);
  }
  rawValue = Number(rawValue);
  el.value = rawValue;

  x = (rawValue - min) / (max - min) * (el.getBoundingClientRect().width - sliderWidth);
  el.style.backgroundPosition = x + 'px 2px';
};
hw.rangeEnd = function(event, el) {
  if (el.getAttribute('data-moving')) {
    el.onchange();
  }
  el.setAttribute('data-moving', '');
};
hw.editImagePreview = function(el) {
  if (el.checked) {
    hw.editImageProcess();
  } else {
    hw.editImageRevert(true);
  }
};
