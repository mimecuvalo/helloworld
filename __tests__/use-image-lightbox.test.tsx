import { afterEach, describe, expect, it } from 'vitest';
import { useRef } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useImageLightbox } from 'components/content/use-image-lightbox';

afterEach(cleanup);

// jsdom never loads an image, so `naturalWidth` is always 0 and
// getBoundingClientRect always zeroes — the hook's size check falls through to
// the markup's own width/height, which is exactly the path a lazy image below
// the fold takes in a real browser.
const big = (src: string, extra = '') => `<img src="${src}" width="600" height="400" alt="a photo" ${extra} />`;
const small = (src: string) => `<img src="${src}" width="32" height="32" alt="an icon" />`;

function setup(html: string) {
  function Harness() {
    const ref = useRef<HTMLDivElement>(null);
    const lightbox = useImageLightbox(ref);
    return (
      <>
        <div ref={ref} data-testid="view" dangerouslySetInnerHTML={{ __html: html }} />
        {lightbox}
      </>
    );
  }
  const { getByTestId } = render(<Harness />);
  return getByTestId('view');
}

// The overlay portals to <body>, so it is never inside render()'s container.
function lightboxImage() {
  return document.querySelector('[role="dialog"] img') as HTMLImageElement | null;
}

function linkBadge() {
  return document.querySelector('[aria-label="open link"]') as HTMLAnchorElement | null;
}

// Opening awaits a decode before it starts the transition.
async function clickImage(img: Element, init?: MouseEventInit) {
  await act(async () => {
    fireEvent.click(img, { button: 0, ...init });
  });
}

function fireTouch(element: Element, type: string, points: { x: number; y: number }[]) {
  const list = points.map(({ x, y }) => ({ clientX: x, clientY: y }));
  const evt = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(evt, 'touches', { value: list });
  Object.defineProperty(evt, 'changedTouches', { value: list });
  element.dispatchEvent(evt);
}

describe('useImageLightbox', () => {
  it('opens an image in the feed on click', async () => {
    const view = setup(big('/photo.jpg'));

    expect(lightboxImage()).toBeNull();
    await clickImage(view.querySelector('img')!);
    expect(lightboxImage()?.src).toContain('/photo.jpg');
  });

  it('leaves icons, avatars and tracking pixels alone', async () => {
    const view = setup(small('/favicon.png'));

    await clickImage(view.querySelector('img')!);
    expect(lightboxImage()).toBeNull();
  });

  it('honours a data-no-lightbox opt-out on the image or an ancestor', async () => {
    const view = setup(
      `<figure data-no-lightbox>${big('/inside.jpg')}</figure>${big('/outside.jpg', 'data-no-lightbox')}`
    );

    for (const img of view.querySelectorAll('img')) await clickImage(img);
    expect(lightboxImage()).toBeNull();
  });

  it('walks the rest of the item on next/prev, and hides the arrow at each end', async () => {
    const view = setup([big('/one.jpg'), big('/two.jpg'), big('/three.jpg')].join(''));
    const images = view.querySelectorAll('img');

    await clickImage(images[0]);
    expect(lightboxImage()?.src).toContain('/one.jpg');
    // Nothing before the first image, so no back arrow to offer.
    expect(document.querySelector('[aria-label="previous"]')).toBeNull();

    await act(async () => {
      fireEvent.click(document.querySelector('[aria-label="next"]')!);
    });
    expect(lightboxImage()?.src).toContain('/two.jpg');
    expect(document.querySelector('[aria-label="previous"]')).not.toBeNull();

    await act(async () => {
      fireEvent.click(document.querySelector('[aria-label="next"]')!);
    });
    expect(lightboxImage()?.src).toContain('/three.jpg');
    expect(document.querySelector('[aria-label="next"]')).toBeNull();

    await act(async () => {
      fireEvent.click(document.querySelector('[aria-label="previous"]')!);
    });
    expect(lightboxImage()?.src).toContain('/two.jpg');
  });

  it('numbers the strip by lightboxable images only, skipping the icons between them', async () => {
    const view = setup([big('/one.jpg'), small('/icon.png'), big('/two.jpg')].join(''));

    await clickImage(view.querySelectorAll('img')[2]);
    expect(lightboxImage()?.src).toContain('/two.jpg');
    // Second of two, not third of three — the icon was never in the strip.
    expect(document.querySelector('[aria-label="next"]')).toBeNull();
    expect(document.querySelector('[aria-label="previous"]')).not.toBeNull();
  });

  it('opens the full-size file a thumbnail links to, rather than the thumbnail', async () => {
    const view = setup(`<a href="/full/photo-2048.jpg">${big('/thumb/photo-320.jpg')}</a>`);

    await clickImage(view.querySelector('img')!);
    expect(lightboxImage()?.src).toContain('/full/photo-2048.jpg');
  });

  it('ignores a link that goes somewhere other than an image', async () => {
    const view = setup(`<a href="https://example.com/post/123">${big('/photo.jpg')}</a>`);

    await clickImage(view.querySelector('img')!);
    expect(lightboxImage()?.src).toContain('/photo.jpg');
  });

  it('leaves a modified click to the link underneath', async () => {
    const view = setup(`<a href="https://example.com/post/123">${big('/photo.jpg')}</a>`);
    const img = view.querySelector('img')!;

    for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) {
      await clickImage(img, { [modifier]: true });
      expect(lightboxImage()).toBeNull();
    }

    // ...and an unmodified one is still ours.
    await clickImage(img);
    expect(lightboxImage()).not.toBeNull();
  });

  it('stops a plain click from following the link it would otherwise navigate to', async () => {
    const view = setup(`<a href="https://example.com/post/123">${big('/photo.jpg')}</a>`);

    let defaultPrevented = false;
    await act(async () => {
      const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
      view.querySelector('img')!.dispatchEvent(evt);
      defaultPrevented = evt.defaultPrevented;
    });
    expect(defaultPrevented).toBe(true);
  });

  it('opens on a pinch out, the same gesture an album thumb takes', async () => {
    const view = setup(big('/photo.jpg'));
    const img = view.querySelector('img')!;

    await act(async () => {
      fireTouch(img, 'touchstart', [{ x: 180, y: 200 }]);
      fireTouch(img, 'touchstart', [
        { x: 180, y: 200 },
        { x: 220, y: 200 },
      ]);
      fireTouch(img, 'touchmove', [
        { x: 100, y: 200 },
        { x: 300, y: 200 },
      ]);
      fireTouch(img, 'touchend', []);
    });

    expect(lightboxImage()?.src).toContain('/photo.jpg');
  });

  it('closes on escape', async () => {
    const view = setup(big('/photo.jpg'));

    await clickImage(view.querySelector('img')!);
    expect(lightboxImage()).not.toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(lightboxImage()).toBeNull();
  });

  it('takes pinch-to-zoom off a container that holds a photo', () => {
    expect(setup(big('/photo.jpg'))).toHaveAttribute('data-lightbox-container');
  });

  it('leaves pinch-to-zoom alone on an item with nothing worth opening', () => {
    expect(setup('<p>just words</p>')).not.toHaveAttribute('data-lightbox-container');
    cleanup();
    expect(setup(small('/icon.png'))).not.toHaveAttribute('data-lightbox-container');
  });

  describe('the link badge', () => {
    it('offers the link the lightbox took over, on hover', () => {
      const view = setup(`<a href="https://example.com/post/123">${big('/photo.jpg')}</a>`);

      expect(linkBadge()).toBeNull();
      fireEvent.mouseOver(view.querySelector('img')!);
      expect(linkBadge()?.href).toBe('https://example.com/post/123');
      expect(linkBadge()?.target).toBe('_blank');
    });

    it('stays out of the way of an image with no link', () => {
      fireEvent.mouseOver(setup(big('/photo.jpg')).querySelector('img')!);
      expect(linkBadge()).toBeNull();
    });

    it('stays out of the way of a link that just points at the picture itself', () => {
      // Following this would land you on what the lightbox already opens.
      const view = setup(`<a href="/full/photo.jpg">${big('/thumb/photo.jpg')}</a>`);
      fireEvent.mouseOver(view.querySelector('img')!);
      expect(linkBadge()).toBeNull();
    });

    it('goes away when the pointer moves to something else in the item', () => {
      const view = setup(`<a href="https://example.com/post/123">${big('/photo.jpg')}</a><p>words</p>`);

      fireEvent.mouseOver(view.querySelector('img')!);
      expect(linkBadge()).not.toBeNull();

      fireEvent.mouseOver(view.querySelector('p')!);
      expect(linkBadge()).toBeNull();
    });

    it('survives the pointer moving onto it — it is stacked over the image, not inside it', () => {
      const view = setup(`<a href="https://example.com/post/123">${big('/photo.jpg')}</a>`);

      fireEvent.mouseOver(view.querySelector('img')!);
      const badge = linkBadge()!;

      // Leaving the container for the badge is what the DOM reports, even
      // though the pointer hasn't left the photo.
      fireEvent.mouseLeave(view, { relatedTarget: badge });
      expect(linkBadge()).not.toBeNull();
    });

    it('goes away when the pointer leaves the item entirely', () => {
      const view = setup(`<a href="https://example.com/post/123">${big('/photo.jpg')}</a>`);

      fireEvent.mouseOver(view.querySelector('img')!);
      expect(linkBadge()).not.toBeNull();

      fireEvent.mouseLeave(view, { relatedTarget: document.body });
      expect(linkBadge()).toBeNull();
    });

    it('survives a relatedTarget that is not an element at all', () => {
      // Leaving the document reports the window rather than an element, and
      // Node.contains throws on anything that isn't a node. (Built by hand:
      // jsdom's MouseEvent constructor won't take a window here either.)
      const view = setup(`<a href="https://example.com/post/123">${big('/photo.jpg')}</a>`);
      fireEvent.mouseOver(view.querySelector('img')!);

      const evt = new MouseEvent('mouseleave');
      Object.defineProperty(evt, 'relatedTarget', { value: window });
      expect(() => act(() => void view.dispatchEvent(evt))).not.toThrow();
      expect(linkBadge()).toBeNull();
    });

    it('is hidden while the lightbox is open', async () => {
      const view = setup(`<a href="https://example.com/post/123">${big('/photo.jpg')}</a>`);

      fireEvent.mouseOver(view.querySelector('img')!);
      expect(linkBadge()).not.toBeNull();

      await clickImage(view.querySelector('img')!);
      expect(lightboxImage()).not.toBeNull();
      expect(linkBadge()).toBeNull();
    });
  });

  it('picks up images that arrive after mount', async () => {
    function Harness({ html }: { html: string }) {
      const ref = useRef<HTMLDivElement>(null);
      const lightbox = useImageLightbox(ref);
      return (
        <>
          <div ref={ref} data-testid="view" dangerouslySetInnerHTML={{ __html: html }} />
          {lightbox}
        </>
      );
    }
    const { getByTestId, rerender } = render(<Harness html="" />);

    await act(async () => {
      rerender(<Harness html={big('/late.jpg')} />);
    });
    await clickImage(getByTestId('view').querySelector('img')!);
    expect(lightboxImage()?.src).toContain('/late.jpg');
  });
});
