import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { cleanup, render } from '@testing-library/react';
import { useGestures } from 'lib/use-gestures';

afterEach(cleanup);

type Point = { x: number; y: number };
type Handlers = Parameters<typeof useGestures>[1];

// jsdom has no TouchEvent, and the hook only ever reads clientX/clientY off the
// touch lists — so a plain Event with those properties stapled on is enough.
// `touches` is every finger currently down, page-wide, regardless of which
// element the event targets; that distinction is the whole point of these tests.
function fireTouch(element: HTMLElement, type: string, touches: Point[], changed: Point[] = touches) {
  const toList = (points: Point[]) => points.map(({ x, y }) => ({ clientX: x, clientY: y }));
  const evt = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(evt, 'touches', { value: toList(touches) });
  Object.defineProperty(evt, 'changedTouches', { value: toList(changed) });
  element.dispatchEvent(evt);
  return evt;
}

function setup(handlers: Handlers) {
  function Target() {
    const ref = useRef<HTMLDivElement>(null);
    useGestures(ref, handlers);
    return <div ref={ref} data-testid="target" />;
  }
  const { getByTestId } = render(<Target />);
  return getByTestId('target');
}

// Two independently-hooked siblings, as an album grid of thumbs would be.
function setupPair(first: Handlers, second: Handlers) {
  function Pair() {
    const firstRef = useRef<HTMLDivElement>(null);
    const secondRef = useRef<HTMLDivElement>(null);
    useGestures(firstRef, first);
    useGestures(secondRef, second);
    return (
      <>
        <div ref={firstRef} data-testid="first" />
        <div ref={secondRef} data-testid="second" />
      </>
    );
  }
  const { getByTestId } = render(<Pair />);
  return [getByTestId('first'), getByTestId('second')] as const;
}

// Trackpad gesture state lives at module scope in the hook — a flick's momentum
// has to keep suppressing repeats even as elements mount and unmount under it.
// So these tests drive the clock, and each one has to hand back a clean slate.
const TRACKPAD_IDLE_LAPSE = 400; // comfortably past the hook's idle window

function useTrackpadTimers() {
  vi.useFakeTimers();
}

function lapseTrackpadGesture() {
  vi.advanceTimersByTime(TRACKPAD_IDLE_LAPSE);
}

function endTrackpadGesture() {
  // Let the idle timer actually run before the fake clock is thrown away,
  // otherwise the hook's module state stays locked into the next test.
  lapseTrackpadGesture();
  vi.useRealTimers();
}

function swipe(element: HTMLElement, from: Point, to: Point) {
  fireTouch(element, 'touchstart', [from]);
  fireTouch(element, 'touchmove', [to]);
  fireTouch(element, 'touchend', [], [to]);
}

const spreadPoints = (spread: number): Point[] => [
  { x: 200 - spread / 2, y: 200 },
  { x: 200 + spread / 2, y: 200 },
];

// `secondFingerOn` is where the second finger physically lands — on a small
// thumbnail that is usually NOT the element the gesture is anchored to.
function pinch(element: HTMLElement, startSpread: number, endSpread: number, secondFingerOn = element) {
  fireTouch(element, 'touchstart', [spreadPoints(startSpread)[0]]);
  fireTouch(secondFingerOn, 'touchstart', spreadPoints(startSpread));
  const move = fireTouch(secondFingerOn, 'touchmove', spreadPoints(endSpread));
  fireTouch(secondFingerOn, 'touchend', [], spreadPoints(endSpread));
  return move;
}

describe('useGestures', () => {
  it('maps a leftward drag to onSwipeLeft and a rightward one to onSwipeRight', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const element = setup({ onSwipeLeft, onSwipeRight });

    swipe(element, { x: 300, y: 200 }, { x: 100, y: 210 });
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();

    swipe(element, { x: 100, y: 200 }, { x: 300, y: 190 });
    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('ignores drags that are too short or mostly vertical', () => {
    const onSwipeLeft = vi.fn();
    const element = setup({ onSwipeLeft });

    swipe(element, { x: 300, y: 200 }, { x: 270, y: 200 }); // under the distance floor
    swipe(element, { x: 300, y: 200 }, { x: 200, y: 400 }); // a scroll, not a swipe
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('fires pinch handlers once the scale threshold is crossed, and blocks the browser zoom', () => {
    const onPinchIn = vi.fn();
    const onPinchOut = vi.fn();
    const element = setup({ onPinchIn, onPinchOut });

    const spread = pinch(element, 100, 200);
    expect(onPinchOut).toHaveBeenCalledTimes(1);
    expect(spread.defaultPrevented).toBe(true);

    pinch(element, 200, 100);
    expect(onPinchIn).toHaveBeenCalledTimes(1);
  });

  it('leaves a pinch that barely moves alone', () => {
    const onPinchIn = vi.fn();
    const onPinchOut = vi.fn();
    const element = setup({ onPinchIn, onPinchOut });

    pinch(element, 100, 110);
    expect(onPinchIn).not.toHaveBeenCalled();
    expect(onPinchOut).not.toHaveBeenCalled();
  });

  it('still sees the pinch when the second finger lands outside the element', () => {
    const onPinchOut = vi.fn();
    const [thumb, neighbour] = setupPair({ onPinchOut }, {});

    pinch(thumb, 100, 200, neighbour);
    expect(onPinchOut).toHaveBeenCalledTimes(1);
  });

  it('lets only the anchoring element claim a pinch spanning two of them', () => {
    const first = vi.fn();
    const second = vi.fn();
    const [thumb, neighbour] = setupPair({ onPinchOut: first }, { onPinchOut: second });

    pinch(thumb, 100, 200, neighbour);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('releases ownership after a gesture so the next one is seen', () => {
    const onPinchOut = vi.fn();
    const element = setup({ onPinchOut });

    pinch(element, 100, 200);
    pinch(element, 100, 200);
    expect(onPinchOut).toHaveBeenCalledTimes(2);
  });

  it("prevents Safari's page zoom on the document, and stops once the gesture ends", () => {
    const element = setup({ onPinchOut: vi.fn() });
    const fireGesture = () => {
      const evt = new Event('gesturestart', { bubbles: true, cancelable: true });
      document.dispatchEvent(evt);
      return evt;
    };

    // Nothing anchored yet, so the page is free to zoom as usual.
    expect(fireGesture().defaultPrevented).toBe(false);

    fireTouch(element, 'touchstart', [{ x: 200, y: 200 }]);
    expect(fireGesture().defaultPrevented).toBe(true);

    fireTouch(element, 'touchend', [], [{ x: 200, y: 200 }]);
    expect(fireGesture().defaultPrevented).toBe(false);
  });

  it('leaves the page zoom alone for callers with no pinch handlers', () => {
    const element = setup({ onSwipeLeft: vi.fn() });

    fireTouch(element, 'touchstart', [{ x: 200, y: 200 }]);
    const evt = new Event('gesturestart', { bubbles: true, cancelable: true });
    document.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(false);

    fireTouch(element, 'touchend', [], [{ x: 200, y: 200 }]);
  });

  describe('trackpad two-finger swipe (wheel deltaX)', () => {
    beforeEach(useTrackpadTimers);
    afterEach(endTrackpadGesture);

    const fireSwipe = (element: HTMLElement, deltaX: number, deltaY = 0) => {
      const evt = new WheelEvent('wheel', { deltaX, deltaY, bubbles: true, cancelable: true });
      element.dispatchEvent(evt);
      return evt;
    };

    it('maps a leftward two-finger swipe to onSwipeLeft, matching the touch gesture', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const element = setup({ onSwipeLeft, onSwipeRight });

      // Moving the fingers leftward scrolls right — positive deltaX.
      const evt = fireSwipe(element, 60);
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeRight).not.toHaveBeenCalled();
      expect(evt.defaultPrevented).toBe(true); // and no browser back-navigation

      lapseTrackpadGesture();
      fireSwipe(element, -60);
      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('fires once per flick, however long the push goes on', () => {
      const onSwipeLeft = vi.fn();
      const element = setup({ onSwipeLeft });

      for (let i = 0; i < 20; i++) fireSwipe(element, 30);
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);

      // A pause between flicks makes the next one count.
      lapseTrackpadGesture();
      fireSwipe(element, 60);
      expect(onSwipeLeft).toHaveBeenCalledTimes(2);
    });

    it('reverses direction immediately, without waiting the burst out', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const element = setup({ onSwipeLeft, onSwipeRight });

      fireSwipe(element, 60);
      fireSwipe(element, -60); // straight back the other way
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    // A real flick: a few genuine pushes, then a long decaying momentum tail the
    // OS keeps emitting after your fingers lift. Wheel events arrive roughly a
    // frame apart, and that timing is the whole point — the burst has to lapse
    // during the tail so the next flick is heard.
    const FRAME_MS = 16;
    const flick = (element: HTMLElement, direction = 1) => {
      const pushes = [30, 60, 50, 40, 30, 20, 14, 10];
      const tail = [5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      for (const magnitude of [...pushes, ...tail]) {
        fireSwipe(element, magnitude * direction);
        vi.advanceTimersByTime(FRAME_MS);
      }
    };

    it('accepts a second flick while the first is still coasting', () => {
      const onSwipeLeft = vi.fn();
      const element = setup({ onSwipeLeft });

      flick(element);
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);

      // No pause: the tail from the first flick never went quiet.
      flick(element);
      expect(onSwipeLeft).toHaveBeenCalledTimes(2);

      flick(element);
      expect(onSwipeLeft).toHaveBeenCalledTimes(3);
    });

    it('counts a hard flick that keeps accelerating as one gesture', () => {
      const onSwipeLeft = vi.fn();
      const element = setup({ onSwipeLeft });

      // Deltas climbing well past the point they tripped the threshold: still
      // one push, so a rising magnitude here must not read as a second flick.
      for (const magnitude of [20, 25, 30, 45, 60, 80, 95, 60, 30, 10, 4, 1]) {
        fireSwipe(element, magnitude);
      }
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('rides out a long momentum tail without moving twice', () => {
      const onSwipeLeft = vi.fn();
      const element = setup({ onSwipeLeft });

      flick(element);
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('does not let one flick walk through a series of remounting elements', () => {
      // Navigating swaps the lightbox element out mid-flick. The momentum tail
      // then lands on a freshly-mounted listener, which must still know the
      // gesture has already been spent.
      const onSwipeLeft = vi.fn();
      let element = setup({ onSwipeLeft });

      fireSwipe(element, 60);
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);

      for (let i = 0; i < 5; i++) {
        cleanup(); // the photo we navigated away from unmounts...
        element = setup({ onSwipeLeft }); // ...and the next one takes its place
        fireSwipe(element, 60); // momentum still arriving
      }
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('leaves vertical scrolling alone', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const element = setup({ onSwipeLeft, onSwipeRight });

      const evt = fireSwipe(element, 5, 200); // a scroll with slight sideways drift
      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
      expect(evt.defaultPrevented).toBe(false);
    });

    it('ignores a swipe for callers that only handle pinches', () => {
      const onPinchOut = vi.fn();
      const element = setup({ onPinchOut });

      const evt = fireSwipe(element, 60);
      expect(onPinchOut).not.toHaveBeenCalled();
      expect(evt.defaultPrevented).toBe(false); // horizontal scrolling still works
    });
  });

  describe('trackpad pinch (ctrl+wheel)', () => {
    beforeEach(useTrackpadTimers);
    afterEach(endTrackpadGesture);

    const fireWheel = (element: HTMLElement, deltaY: number, ctrlKey = true) => {
      const evt = new WheelEvent('wheel', { deltaY, ctrlKey, bubbles: true, cancelable: true });
      element.dispatchEvent(evt);
      return evt;
    };

    it('opens on a spread and closes on a squeeze, preventing the browser zoom', () => {
      const onPinchIn = vi.fn();
      const onPinchOut = vi.fn();
      const element = setup({ onPinchIn, onPinchOut });

      // Zooming in scrolls "up" — negative deltaY.
      const out = fireWheel(element, -30);
      expect(onPinchOut).toHaveBeenCalledTimes(1);
      expect(out.defaultPrevented).toBe(true);

      lapseTrackpadGesture();
      fireWheel(element, 30);
      expect(onPinchIn).toHaveBeenCalledTimes(1);
    });

    it('opens once per pinch, however far you keep spreading', () => {
      const onPinchOut = vi.fn();
      const element = setup({ onPinchOut });

      for (let i = 0; i < 20; i++) fireWheel(element, -30);
      expect(onPinchOut).toHaveBeenCalledTimes(1);
    });

    it('ignores an ordinary scroll and leaves it to the page', () => {
      const onPinchIn = vi.fn();
      const onPinchOut = vi.fn();
      const element = setup({ onPinchIn, onPinchOut });

      const evt = fireWheel(element, -300, false);
      expect(onPinchIn).not.toHaveBeenCalled();
      expect(onPinchOut).not.toHaveBeenCalled();
      expect(evt.defaultPrevented).toBe(false);
    });

    it('acts on the push and ignores the coasting that follows it', () => {
      const onPinchOut = vi.fn();
      const element = setup({ onPinchOut });

      // Deltas this small are momentum, not fingers — on their own they do
      // nothing, and they must not hold the burst open either.
      for (const magnitude of [-2, -1, -1]) fireWheel(element, magnitude);
      expect(onPinchOut).not.toHaveBeenCalled();

      fireWheel(element, -12); // a real push
      expect(onPinchOut).toHaveBeenCalledTimes(1);
    });

    it('still swallows the page zoom for a caller that only handles one direction', () => {
      const onPinchIn = vi.fn();
      const element = setup({ onPinchIn });

      const evt = fireWheel(element, -30); // spread, with no onPinchOut to run
      expect(evt.defaultPrevented).toBe(true);
      expect(onPinchIn).not.toHaveBeenCalled();
    });
  });

  it('swallows the click that trails a gesture', () => {
    const onClick = vi.fn();
    const element = setup({ onSwipeLeft: vi.fn(), onPinchOut: vi.fn() });
    element.addEventListener('click', onClick);

    swipe(element, { x: 300, y: 200 }, { x: 100, y: 200 });
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).not.toHaveBeenCalled();

    // ...but a later, standalone click still gets through.
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
