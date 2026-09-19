import { type RefObject, useEffect, useRef, useState } from 'react';
import { decodeSoon } from 'lib/decode-image';
import { attachGestures } from 'lib/use-gestures';
import { withViewTransition } from 'lib/view-transition';
import Lightbox, { HERO_NAME } from './Lightbox';
import styles from './content.module.css';

// Icons, avatars, emoji, spacers and tracking pixels all arrive as <img> too.
// Nothing this small is a photo anyone wants blown up.
const MIN_SIZE = 64;

const IMAGE_HREF = /\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i;

// An escape hatch for markup that knows better — an inline logo inside a
// paragraph, say. Set `data-no-lightbox` on the image or any ancestor.
function isLightboxable(img: HTMLImageElement) {
  if (img.closest('[data-no-lightbox]')) return false;
  const rect = img.getBoundingClientRect();
  // A lazy image below the fold hasn't been laid out yet, and one that hasn't
  // loaded has no natural size — fall back to whatever the markup claims so it
  // isn't written off as an icon.
  const width = rect.width || img.naturalWidth || img.width;
  const height = rect.height || img.naturalHeight || img.height;
  return width >= MIN_SIZE && height >= MIN_SIZE;
}

// Feed HTML routinely wraps a downscaled image in a link to the full-size one.
// That link is what the lightbox is for, so follow it rather than blowing up
// the thumbnail. Anything else — a link to the post, a tag page — is ignored.
function fullSrc(img: HTMLImageElement) {
  const link = img.closest('a');
  if (link && IMAGE_HREF.test(link.getAttribute('href') || '')) return link.href;
  return img.currentSrc || img.src;
}

// `relatedTarget` is only sometimes an element. Leaving the document hands you
// null or the window instead, and passing either to Node.contains throws.
function contains(parent: Node | null | undefined, node: EventTarget | null | undefined) {
  if (!parent || !node || !(typeof node === 'object' && 'nodeType' in node)) return false;
  return parent.contains(node as Node);
}

// The link the lightbox is about to take away from you, if there is one worth
// offering back. A link straight to an image file isn't: `fullSrc` already
// opens exactly that.
function outboundHref(img: HTMLImageElement) {
  const link = img.closest('a');
  const href = link?.getAttribute('href');
  if (!link || !href || IMAGE_HREF.test(href)) return null;
  return link.href;
}

/**
 * Give every worthwhile image inside `containerRef` the album's lightbox: click
 * or pinch out to open, arrows/swipe to walk the rest of the item's images,
 * escape or pinch in to close.
 *
 * Returns the overlay to render (null while it's shut).
 *
 * Unlike the album — which owns its thumbs as components — the containers here
 * hold markup we didn't render, dropped in through dangerouslySetInnerHTML. So
 * the images are found by walking the DOM, and re-walked whenever the feed
 * swaps its HTML out from under us.
 *
 * `deps` re-binds against a fresh container, for callers who unmount theirs —
 * the ref object's identity is stable even when the element it points at isn't.
 */
export function useImageLightbox(containerRef: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  const [openIndex, setOpenIndex] = useState(-1);
  // The images as they stood when the lightbox opened. Snapshotting keeps
  // next/prev from renumbering themselves if the feed re-renders behind the
  // overlay.
  const imagesRef = useRef<HTMLImageElement[]>([]);
  // Mirrors `openIndex` for callbacks that run after a transition, past the
  // point where their closure's copy is still trustworthy.
  const openIndexRef = useRef(-1);
  // Which image currently carries the hero `view-transition-name`, if any.
  const heroRef = useRef<HTMLImageElement | null>(null);
  // The link badge shown over a hovered image, and the image it belongs to.
  // Its position is seeded here and then maintained imperatively — see
  // `positionBadge`.
  const [badge, setBadge] = useState<{ href: string; top: number; left: number } | null>(null);
  const hoveredRef = useRef<HTMLImageElement | null>(null);
  const badgeRef = useRef<HTMLAnchorElement>(null);

  // The hero name has to be on the source image *before* the browser snapshots
  // the old state, and off it again once the lightbox claims the name — two
  // elements sharing one name aborts the transition. Moving it imperatively
  // keeps it out of React's commit, which happens too late to be captured.
  const setHero = (img: HTMLImageElement | null) => {
    const next = img?.isConnected ? img : null;
    if (heroRef.current === next) return;
    if (heroRef.current) heroRef.current.style.viewTransitionName = '';
    heroRef.current = next;
    if (next) next.style.viewTransitionName = HERO_NAME;
  };

  const open = async (img: HTMLImageElement) => {
    const container = containerRef.current;
    if (!container) return;
    const images = Array.from(container.querySelectorAll('img')).filter(isLightboxable);
    const index = images.indexOf(img);
    if (index === -1) return;

    imagesRef.current = images;
    await decodeSoon(fullSrc(img));
    setHero(img);
    openIndexRef.current = index;
    withViewTransition('open', () => {
      setOpenIndex(index);
      setHero(null);
    });
  };

  const close = () => {
    const img = imagesRef.current[openIndexRef.current];
    openIndexRef.current = -1;
    withViewTransition('close', () => {
      setOpenIndex(-1);
      setHero(img);
    }).finally(() => {
      // Leave the name in place if something reopened while we were animating.
      if (openIndexRef.current === -1) setHero(null);
    });
  };

  const go = async (index: number, kind: 'next' | 'prev') => {
    const img = imagesRef.current[index];
    if (!img || index === openIndexRef.current) return;
    await decodeSoon(fullSrc(img));
    openIndexRef.current = index;
    withViewTransition(kind, () => setOpenIndex(index));
  };

  // The badge is anchored to an image we didn't render and can't wrap, so it's
  // positioned from script against the image's box. Reads go through the DOM
  // rather than state: in a feed the pointer is very often resting on a photo
  // while the page scrolls under it, and re-rendering the whole item per frame
  // to move a 24px button would be a poor trade.
  const positionBadge = () => {
    const img = hoveredRef.current;
    const element = badgeRef.current;
    if (!img || !element) return;
    if (!img.isConnected) return setBadge(null);
    const rect = img.getBoundingClientRect();
    element.style.top = `${rect.top}px`;
    element.style.left = `${rect.right}px`;
  };

  const showBadgeFor = (img: HTMLImageElement | null) => {
    hoveredRef.current = img;
    const href = img && outboundHref(img);
    if (!img || !href) return setBadge(null);
    const rect = img.getBoundingClientRect();
    setBadge({ href, top: rect.top, left: rect.right });
  };

  // The listeners below are bound once, so they'd otherwise be stuck with the
  // first render's closure.
  const openRef = useRef(open);
  openRef.current = open;
  const showBadgeForRef = useRef(showBadgeFor);
  showBadgeForRef.current = showBadgeFor;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onClick = (evt: MouseEvent) => {
      // A modified or middle click is someone deliberately reaching for the
      // link underneath — open the source in a tab as they asked, not a
      // lightbox on top of the page they're leaving.
      if (evt.button !== 0 || evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return;
      const img = (evt.target as Element | null)?.closest?.('img');
      if (!img || !isLightboxable(img as HTMLImageElement)) return;
      evt.preventDefault();
      openRef.current(img as HTMLImageElement);
    };

    // Show the link badge for the image under the pointer, and take it away
    // again for anything else. `mouseover` bubbles, so one listener covers
    // every image in the container.
    const onMouseOver = (evt: MouseEvent) => {
      const img = (evt.target as Element | null)?.closest?.('img');
      showBadgeForRef.current(img && isLightboxable(img) ? img : null);
    };

    // Moving onto the badge leaves the container as far as the DOM is
    // concerned, even though the pointer is still over the image — the badge
    // is stacked on top rather than nested inside. Hiding on that would make
    // the badge impossible to click.
    const onMouseLeave = (evt: MouseEvent) => {
      if (contains(badgeRef.current, evt.relatedTarget)) return;
      showBadgeForRef.current(null);
    };

    const attached = new Map<HTMLImageElement, () => void>();
    const scan = () => {
      for (const img of container.querySelectorAll('img')) {
        if (attached.has(img) || !isLightboxable(img)) continue;
        img.dataset.lightboxImage = ''; // styling hook — see content.module.css
        attached.set(img, attachGestures(img, { current: { onPinchOut: () => openRef.current(img) } }));
      }
      for (const [img, detach] of attached) {
        if (img.isConnected) continue; // the feed re-rendered it away
        detach();
        attached.delete(img);
      }
      // A pinch has to be preventDefault-ed to stop the browser zooming, and
      // that has to happen on the container rather than the images — the
      // second finger routinely lands in the prose beside the photo. So the
      // flag only goes on containers that actually hold a photo: a text-only
      // post keeps its pinch-to-zoom.
      container.toggleAttribute('data-lightbox-container', attached.size > 0);
    };

    scan();
    // Two things make an image eligible after the fact: markup arriving (a feed
    // page loading in) and an image finishing its load, which is the first
    // moment a lazy one has a size to measure. `load` doesn't bubble, hence the
    // capture phase.
    const observer = new MutationObserver(scan);
    observer.observe(container, { childList: true, subtree: true });
    container.addEventListener('load', scan, true);
    container.addEventListener('click', onClick);
    container.addEventListener('mouseover', onMouseOver);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      observer.disconnect();
      container.removeEventListener('load', scan, true);
      container.removeEventListener('click', onClick);
      container.removeEventListener('mouseover', onMouseOver);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeAttribute('data-lightbox-container');
      for (const detach of attached.values()) detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, ...deps]);

  // Deliberately re-subscribed every render: the handlers close over the open
  // index, and there's nothing to listen for while the lightbox is shut.
  useEffect(() => {
    if (openIndex === -1) return;
    const onKey = (evt: KeyboardEvent) => {
      if (evt.key === 'ArrowLeft') go(openIndex - 1, 'prev');
      else if (evt.key === 'ArrowRight') go(openIndex + 1, 'next');
    };
    window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  });

  // The badge is fixed to the viewport, so anything that moves the image out
  // from under it has to be followed — including a scroll inside the feed
  // item's own overflow box, which is why this listens in the capture phase
  // rather than on window alone.
  const isBadgeShown = !!badge;
  useEffect(() => {
    if (!isBadgeShown) return;
    const reposition = () => positionBadge();
    document.addEventListener('scroll', reposition, { capture: true, passive: true });
    window.addEventListener('resize', reposition, { passive: true });
    return () => {
      document.removeEventListener('scroll', reposition, { capture: true });
      window.removeEventListener('resize', reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBadgeShown]);

  const current = imagesRef.current[openIndex];

  return (
    <>
      {/* Hidden while the lightbox is up: it covers the image anyway, and the
          pointer can't reach the feed behind it. */}
      {badge && !current ? (
        <a
          ref={badgeRef}
          className={styles.imageLink}
          style={{ top: badge.top, left: badge.left }}
          href={badge.href}
          target="_blank"
          rel="noreferrer noopener"
          title={badge.href}
          aria-label="open link"
          onMouseLeave={(evt) => {
            if (contains(containerRef.current, evt.relatedTarget)) return;
            showBadgeFor(null);
          }}
        >
          ↗
        </a>
      ) : null}
      {current ? (
        <Lightbox
          images={[fullSrc(current)]}
          alt={current.alt || undefined}
          onClose={close}
          onPrev={openIndex > 0 ? () => go(openIndex - 1, 'prev') : undefined}
          onNext={openIndex < imagesRef.current.length - 1 ? () => go(openIndex + 1, 'next') : undefined}
        />
      ) : null}
    </>
  );
}
