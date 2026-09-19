import { type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { F } from 'i18n';
import { useGestures } from 'lib/use-gestures';
import styles from './content.module.css';

// Shared with whatever opened the lightbox — an album thumb, a feed image — so
// the two can morph into each other.
export const HERO_NAME = 'lightbox-hero';

export default function Lightbox({
  onClose,
  onPrev,
  onNext,
  images,
  alt,
  header,
}: {
  onClose: () => void;
  // Left off when there's nothing in that direction; the arrow goes away with
  // them, and so does the swipe.
  onPrev?: () => void;
  onNext?: () => void;
  images: string[];
  alt?: string;
  header?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Freeze the page behind the overlay: a wheel or trackpad gesture over the
  // lightbox would otherwise scroll what's underneath it. The lock goes on
  // <html>, not <body> — globals.css gives <html> `overflow-x: clip`, which
  // makes it the scroll container and stops <body>'s overflow from propagating
  // to the viewport. Only the y axis is touched so the `overflow-x: clip` hack
  // keeping the sticky sidebar alive stays in place. Padding stands in for the
  // scrollbar the lock removes, so the page doesn't shift sideways behind the
  // backdrop.
  useEffect(() => {
    const root = document.documentElement;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    const previousOverflowY = root.style.overflowY;
    const previousPaddingRight = root.style.paddingRight;

    root.style.overflowY = 'hidden';
    if (scrollbarWidth > 0) {
      root.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      root.style.overflowY = previousOverflowY;
      root.style.paddingRight = previousPaddingRight;
    };
  }, []);

  // Swiping drags the strip of photos along with your finger — leftward brings
  // the next one in. Pinching in dismisses, mirroring the pinch-out that opened
  // the lightbox from a thumb or a feed image.
  useGestures(dialogRef, { onSwipeLeft: onNext, onSwipeRight: onPrev, onPinchIn: onClose });

  // Only genuine empty space dismisses: the backdrop itself, or the gutter
  // around the photo. Clicks that land on the photo, its header, or a control
  // have a different target and are left alone.
  const handleEmptySpaceClick = (evt: ReactMouseEvent<HTMLDivElement>) => {
    if (evt.target === evt.currentTarget) onClose();
  };

  // Rendered at the top of the document rather than in place. In a feed the
  // opener sits inside a masonry column that scrolls, clips, and — once the
  // item has been marked read — fades to 30% opacity; a `position: fixed`
  // overlay parented there would inherit all three.
  return createPortal(
    <div
      ref={dialogRef}
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      onMouseDown={handleEmptySpaceClick}
    >
      <button type="button" className={`${styles.lightboxClose} notranslate`} onClick={onClose} aria-label="close">
        ✕
      </button>
      {onPrev ? (
        <button
          type="button"
          className={`${styles.lightboxPrev} notranslate`}
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="previous"
        >
          ‹
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          className={`${styles.lightboxNext} notranslate`}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="next"
        >
          ›
        </button>
      ) : null}

      <div className={styles.lightboxContent} onMouseDown={handleEmptySpaceClick}>
        {header}
        {images.length ? (
          images.map((image, index) => (
            <img
              key={image}
              className={styles.lightboxImage}
              src={image}
              alt={alt || ''}
              // The first image is what morphs out of the opener and slides
              // between items; the rest ride along in the root snapshot.
              style={index === 0 ? { viewTransitionName: HERO_NAME } : undefined}
            />
          ))
        ) : (
          <F defaultMessage="Loading…" />
        )}
      </div>
    </div>,
    document.body
  );
}
