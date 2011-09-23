/**
 * @fileoverview Functions for the calculating positions of thumbs and whether to load them
 * 
 * @author mimecuvalo@gmail.com (Mime Cuvalo)
 */

hw.thumbnailDelayLoad = {};

hw.thumbnailDelayLoad.htmlElement = document.getElementsByTagName('html')[0];


/**
 * Test element to see if it is the body tag
 * 
 * @param {Element} element Element to test
 */
hw.thumbnailDelayLoad.isBody = function(element) {
	return (/^(?:body|html)$/i).test(element.tagName);
};


/**
 * Returns the window scroll position
 * 
 */
hw.thumbnailDelayLoad.getWindowScrollY = function() {
	var doc = (!document.compatMode || document.compatMode == 'CSS1Compat') ? hw.thumbnailDelayLoad.htmlElement : document.body;
	return window.pageYOffset || doc.scrollTop;
};


/**
 * Returns the window height
 * 
 */
hw.thumbnailDelayLoad.getWindowSizeY = function() {
	if (window.opera || (!window.ActiveXObject && !navigator.taintEnabled)) return window.innerHeight;
	var doc = (!document.compatMode || document.compatMode == 'CSS1Compat') ? hw.thumbnailDelayLoad.htmlElement : document.body;
	return doc.clientHeight;
};


/**
 * Retrieve the scrollY of an element
 * 
 * @param {Element} element The element to get the scrollY of
 */
hw.thumbnailDelayLoad.getScrollY = function(element) {
	var position = 0;
	while (element && !hw.thumbnailDelayLoad.isBody(element)) {
		position += element.scrollTop;
		element = /** @type {Element}*/ (element.parentNode);
	}
	return position;
};


/**
 * Returns the offsetY of an element
 * 
 * @param {Element} element The element to get the offsetY of
 */
hw.thumbnailDelayLoad.getOffsetY = function(element) {
	if (document.documentElement["getBoundingClientRect"]) {
		var bound = element.getBoundingClientRect(), html = document.documentElement;
		return bound.top + html.scrollTop - html.clientTop;
	} else {
		// short-circuit other browsers (webkit, firefox 2) to keep the browser speedy as possible
		return 0;
	}
};


/**
 * Returns the postionY of an element (getOffsetY - getScrollY)
 * 
 * @param {Element} element The element to get the positionY of
 */
hw.thumbnailDelayLoad.getPositionY = function(element) {
	if (document.documentElement["getBoundingClientRect"]) {
		var offsetY = hw.thumbnailDelayLoad.getOffsetY(element), scrollY = hw.thumbnailDelayLoad.getScrollY(element);
		return offsetY - scrollY;
	} else {
		// short-circuit other browsers (webkit, firefox 2) to keep the browser speedy as possible
		return 0;
	}
};


hw.thumbnailDelayLoad.fudgeFactor = 175;		// load some images below the fold for quicker perceived time
hw.thumbnailDelayLoad.loadAllAtOnce = false;


/**
 * See if the thumbnail should be loaded in.  If so, load it.
 * 
 * @param {Element} img The image to test
 * @param {number} windowPositionY The position of the fold line
 */
hw.thumbnailDelayLoad.testImage = function(img, windowPositionY) {
	// get the position of the 'fold' line from the parameter or manually
	windowPositionY = windowPositionY || (hw.thumbnailDelayLoad.getWindowScrollY() + hw.thumbnailDelayLoad.getWindowSizeY());

	if (hw.thumbnailDelayLoad.loadAllAtOnce || (hw.thumbnailDelayLoad.getPositionY(img) <= windowPositionY + hw.thumbnailDelayLoad.fudgeFactor)) {
		// image is above the fold, load in the image
		img.src = img.getAttribute('data-thumb');
		img.removeAttribute('data-thumb');
	}
};


/**
 * Go through images in the page and test them if they should be loaded
 *
 */
hw.thumbnailDelayLoad.loadImages = function() {
	var imgs = document.getElementsByTagName('IMG');
	// get the position of the fold line
	var windowPositionY = hw.thumbnailDelayLoad.getWindowScrollY() + hw.thumbnailDelayLoad.getWindowSizeY();

	for (var x = 0; x < imgs.length; ++x) {
		if (imgs[x].getAttribute('data-thumb')) {
			// test the image to see if it's above the fold
			hw.thumbnailDelayLoad.testImage(imgs[x], windowPositionY);
		}
	}
};

hw.thumbnailDelayLoad.transition = function(img) {
  if (!img.getAttribute('data-thumb')) {
    hw.removeClass(img, 'hw-invisible');
  }
};
