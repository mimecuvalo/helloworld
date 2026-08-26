import { describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { render } from '@testing-library/react';
import { useGestures } from 'lib/use-gestures';

type Point = { x: number; y: number };

// jsdom has no TouchEvent, and the hook only ever reads clientX/clientY off the
// touch lists — so a plain Event with those properties stapled on is enough.
function fireTouch(element: HTMLElement, type: string, touches: Point[], changed: Point[] = touches) {
  const toList = (points: Point[]) => points.map(({ x, y }) => ({ clientX: x, clientY: y }));
  const evt = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(evt, 'touches', { value: toList(touches) });
  Object.defineProperty(evt, 'changedTouches', { value: toList(changed) });
  element.dispatchEvent(evt);
  return evt;
}

function setup(handlers: Parameters<typeof useGestures>[1]) {
  function Target() {
    const ref = useRef<HTMLDivElement>(null);
    useGestures(ref, handlers);
    return <div ref={ref} data-testid="target" />;
  }
  const { getByTestId } = render(<Target />);
  return getByTestId('target');
}

function swipe(element: HTMLElement, from: Point, to: Point) {
  fireTouch(element, 'touchstart', [from]);
  fireTouch(element, 'touchmove', [to]);
  fireTouch(element, 'touchend', [], [to]);
}

function pinch(element: HTMLElement, startSpread: number, endSpread: number) {
  fireTouch(element, 'touchstart', [
    { x: 200 - startSpread / 2, y: 200 },
    { x: 200 + startSpread / 2, y: 200 },
  ]);
  return fireTouch(element, 'touchmove', [
    { x: 200 - endSpread / 2, y: 200 },
    { x: 200 + endSpread / 2, y: 200 },
  ]);
}

describe('useGestures', () => {
  it('reports a leftward drag as a left swipe and a rightward one as a right swipe', () => {
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
