import { type RefObject, useEffect, useRef } from 'react';

type GestureHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
};

const SWIPE_MIN_DISTANCE = 50; // px travelled before we call it a swipe
const SWIPE_MAX_OFF_AXIS = 0.7; // |dy| / |dx| we still consider horizontal
const PINCH_IN_SCALE = 0.75;
const PINCH_OUT_SCALE = 1.3;
const CLICK_SUPPRESS_MS = 400;

function touchDistance(touches: TouchList) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

// Horizontal swipes + pinches on touch devices. Listeners are attached natively
// rather than through React props because React registers touchmove passively,
// and we need preventDefault() to keep the browser from page-zooming out from
// under a pinch.
export function useGestures(ref: RefObject<HTMLElement | null>, handlers: GestureHandlers) {
  // Handlers are inline closures at every call site — keep them in a ref so the
  // listeners bind once instead of on every render.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let isSwiping = false;
    let pinchStartDistance = 0;

    // A swipe or pinch that ends on top of a link/backdrop still emits a click;
    // swallow it so the gesture doesn't also navigate or dismiss.
    const suppressNextClick = () => {
      const onClick = (evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
      };
      element.addEventListener('click', onClick, { capture: true, once: true });
      setTimeout(() => element.removeEventListener('click', onClick, { capture: true }), CLICK_SUPPRESS_MS);
    };

    const onTouchStart = (evt: TouchEvent) => {
      if (evt.touches.length === 2) {
        isSwiping = false;
        pinchStartDistance = touchDistance(evt.touches);
      } else if (evt.touches.length === 1) {
        pinchStartDistance = 0;
        isSwiping = true;
        startX = evt.touches[0].clientX;
        startY = evt.touches[0].clientY;
      }
    };

    const onTouchMove = (evt: TouchEvent) => {
      if (evt.touches.length !== 2 || !pinchStartDistance) return;
      if (evt.cancelable) evt.preventDefault();

      const scale = touchDistance(evt.touches) / pinchStartDistance;
      const handler =
        scale <= PINCH_IN_SCALE
          ? handlersRef.current.onPinchIn
          : scale >= PINCH_OUT_SCALE
            ? handlersRef.current.onPinchOut
            : undefined;
      if (!handler) return;

      // Fire mid-gesture so the pinch feels immediate, then stand down until the
      // next touch sequence starts.
      pinchStartDistance = 0;
      suppressNextClick();
      handler();
    };

    const onTouchEnd = (evt: TouchEvent) => {
      const touch = evt.changedTouches[0];
      if (!isSwiping || evt.touches.length || !touch) return;
      isSwiping = false;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE || Math.abs(deltaY) > Math.abs(deltaX) * SWIPE_MAX_OFF_AXIS) return;

      const handler = deltaX < 0 ? handlersRef.current.onSwipeLeft : handlersRef.current.onSwipeRight;
      if (!handler) return;
      suppressNextClick();
      handler();
    };

    // Safari fires its own non-standard gesture events and zooms the page off
    // them even when touchmove is prevented.
    const onGesture = (evt: Event) => {
      const { onPinchIn, onPinchOut } = handlersRef.current;
      if ((onPinchIn || onPinchOut) && evt.cancelable) evt.preventDefault();
    };

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd, { passive: true });
    element.addEventListener('touchcancel', onTouchEnd, { passive: true });
    element.addEventListener('gesturestart', onGesture);
    element.addEventListener('gesturechange', onGesture);
    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchEnd);
      element.removeEventListener('gesturestart', onGesture);
      element.removeEventListener('gesturechange', onGesture);
    };
  }, [ref]);
}
