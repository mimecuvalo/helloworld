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
const SWIPE_WHEEL_PUSH = 6; // deltaX in a single event that counts as a deliberate push
const PINCH_WHEEL_PUSH = 4; // ...and the equivalent for a pinch's deltaY
const WHEEL_BURST_MS = 150; // how long one flick keeps owning its direction

// Only one element may own a gesture at a time. Pinching a thumbnail regularly
// puts the second finger down on a neighbouring thumb, and without this that
// neighbour would anchor a competing gesture and open its own lightbox too.
let gestureOwner: HTMLElement | null = null;

// A trackpad flick arrives as a burst: a handful of real pushes, then a long
// decaying momentum tail the OS keeps emitting after your fingers have already
// left the trackpad. We act on the first push of a burst and ignore the rest.
//
// The subtlety is which events are allowed to hold that burst open. Only the
// ones above the push magnitude — the tail drops under it almost immediately,
// so the burst lapses shortly after your fingers stop rather than being held
// for the entire coast. Letting tail events refresh it is what made every flick
// after the first vanish, since the tail of one flick ran into the next.
//
// Each direction gets its own burst, so reversing works immediately. State is
// module-level rather than per-element on purpose: navigating swaps in a
// different lightbox element mid-flick, and per-element state would reset with
// it and let one flick walk through photo after photo.
const wheelBursts = new Map<string, ReturnType<typeof setTimeout>>();

// True only for the opening push of a burst.
function startsWheelBurst(direction: string) {
  const isFirst = !wheelBursts.has(direction);
  clearTimeout(wheelBursts.get(direction));
  wheelBursts.set(
    direction,
    setTimeout(() => wheelBursts.delete(direction), WHEEL_BURST_MS)
  );
  return isFirst;
}

function touchDistance(touches: TouchList) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

// Horizontal swipes and pinches, from either a touchscreen or a trackpad.
//
// Trackpad gestures are not touch gestures at all: the OS reports them as wheel
// events — a pinch carries ctrlKey (precisely how the browser triggers its own
// page zoom), a two-finger swipe carries a dominant deltaX (how it triggers
// back/forward navigation). Both have to be prevented on a non-passive listener
// rather than merely observed; on a desktop no touch event is ever fired, so
// without this branch a pinch just zooms the document.
//
// A touchscreen pinch is *anchored* on the element (the first finger has to
// land on it) but *tracked* on the document. touchstart only fires on an
// element when a touch begins inside it, and the second finger usually lands
// somewhere else entirely — on anything smaller than the viewport, an
// element-only listener never sees the pinch at all.
//
// Listeners are attached natively rather than through React props because React
// registers touchmove and wheel passively, and we need preventDefault() to keep
// the browser from zooming out from under a pinch.
// `deps` re-binds the listeners — pass whatever decides that the ref's element
// has come or gone, for callers whose target isn't mounted on the first render.
export function useGestures(ref: RefObject<HTMLElement | null>, handlers: GestureHandlers, deps: unknown[] = []) {
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
    function suppressNextClick() {
      const onClick = (evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
      };
      element!.addEventListener('click', onClick, { capture: true, once: true });
      setTimeout(() => element!.removeEventListener('click', onClick, { capture: true }), CLICK_SUPPRESS_MS);
    }

    function beginPinch(touches: TouchList) {
      isSwiping = false;
      pinchStartDistance = touchDistance(touches);
    }

    function onAnchorTouchStart(evt: TouchEvent) {
      if (gestureOwner) return;
      gestureOwner = element;

      if (evt.touches.length >= 2) {
        beginPinch(evt.touches);
      } else {
        isSwiping = true;
        startX = evt.touches[0].clientX;
        startY = evt.touches[0].clientY;
      }

      document.addEventListener('touchstart', onDocTouchStart, { passive: true });
      document.addEventListener('touchmove', onDocTouchMove, { passive: false });
      document.addEventListener('touchend', onDocTouchEnd, { passive: true });
      document.addEventListener('touchcancel', onDocTouchEnd, { passive: true });
      document.addEventListener('gesturestart', onGesture);
      document.addEventListener('gesturechange', onGesture);
      document.addEventListener('gestureend', onGesture);
    }

    // A second finger landing anywhere on the page promotes the anchored touch
    // into a pinch.
    function onDocTouchStart(evt: TouchEvent) {
      if (evt.touches.length >= 2) beginPinch(evt.touches);
    }

    function onDocTouchMove(evt: TouchEvent) {
      if (evt.touches.length < 2 || !pinchStartDistance) return;
      if (evt.cancelable) evt.preventDefault();

      const scale = touchDistance(evt.touches) / pinchStartDistance;
      const handler =
        scale <= PINCH_IN_SCALE
          ? handlersRef.current.onPinchIn
          : scale >= PINCH_OUT_SCALE
            ? handlersRef.current.onPinchOut
            : undefined;
      if (!handler) return;

      // Fire mid-gesture so the pinch feels immediate, then stand down until
      // every finger has lifted.
      pinchStartDistance = 0;
      suppressNextClick();
      handler();
    }

    function onDocTouchEnd(evt: TouchEvent) {
      if (evt.touches.length) return; // other fingers still down

      const touch = evt.changedTouches[0];
      if (isSwiping && touch) {
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        const isHorizontal =
          Math.abs(deltaX) >= SWIPE_MIN_DISTANCE && Math.abs(deltaY) <= Math.abs(deltaX) * SWIPE_MAX_OFF_AXIS;
        const handler = deltaX < 0 ? handlersRef.current.onSwipeLeft : handlersRef.current.onSwipeRight;
        if (isHorizontal && handler) {
          suppressNextClick();
          handler();
        }
      }
      endGesture();
    }

    function endGesture() {
      isSwiping = false;
      pinchStartDistance = 0;
      if (gestureOwner === element) gestureOwner = null;
      document.removeEventListener('touchstart', onDocTouchStart);
      document.removeEventListener('touchmove', onDocTouchMove);
      document.removeEventListener('touchend', onDocTouchEnd);
      document.removeEventListener('touchcancel', onDocTouchEnd);
      document.removeEventListener('gesturestart', onGesture);
      document.removeEventListener('gesturechange', onGesture);
      document.removeEventListener('gestureend', onGesture);
    }

    // Safari zooms the page off its own non-standard gesture events even when
    // touchmove is prevented. These go on the document, not the element: the
    // gesture events target whatever sits under the midpoint between the two
    // fingers, which for a pinch on a thumbnail is rarely the thumbnail.
    function onGesture(evt: Event) {
      const { onPinchIn, onPinchOut } = handlersRef.current;
      if ((onPinchIn || onPinchOut) && evt.cancelable) evt.preventDefault();
    }

    // Trackpad gestures, acted on at the leading edge of each burst.
    function onWheel(evt: WheelEvent) {
      const { onPinchIn, onPinchOut, onSwipeLeft, onSwipeRight } = handlersRef.current;

      // Pinch: a ctrl-modified wheel event. Zooming in scrolls "up" (negative).
      if (evt.ctrlKey) {
        if (!onPinchIn && !onPinchOut) return;
        if (evt.cancelable) evt.preventDefault();
        if (Math.abs(evt.deltaY) < PINCH_WHEEL_PUSH) return; // coasting, not pushing
        const isSpreading = evt.deltaY < 0;
        if (!startsWheelBurst(isSpreading ? 'spread' : 'squeeze')) return;
        (isSpreading ? onPinchOut : onPinchIn)?.();
        return;
      }

      // Two-finger swipe: a plain wheel event whose deltaX dominates. Moving the
      // fingers leftward scrolls right, so positive deltaX is a leftward swipe.
      if (!onSwipeLeft && !onSwipeRight) return;
      if (Math.abs(evt.deltaX) <= Math.abs(evt.deltaY)) return; // a vertical scroll
      // Also stops the browser's own back/forward swipe navigation.
      if (evt.cancelable) evt.preventDefault();
      if (Math.abs(evt.deltaX) < SWIPE_WHEEL_PUSH) return; // coasting, not pushing
      const isLeftward = evt.deltaX > 0;
      if (!startsWheelBurst(isLeftward ? 'left' : 'right')) return;
      (isLeftward ? onSwipeLeft : onSwipeRight)?.();
    }

    element.addEventListener('touchstart', onAnchorTouchStart, { passive: true });
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      element.removeEventListener('touchstart', onAnchorTouchStart);
      element.removeEventListener('wheel', onWheel);
      endGesture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);
}
