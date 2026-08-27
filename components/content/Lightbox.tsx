import { type MouseEvent as ReactMouseEvent, useEffect, useRef } from 'react';
import { F } from 'i18n';
import { useGestures } from 'lib/use-gestures';
import Header from './Header';
import styles from './content.module.css';

// Shared with the album thumbs so the two can morph into each other.
export const HERO_NAME = 'lightbox-hero';

type LightboxContent = {
  title?: string | null;
  forceRefresh?: boolean | null;
  hidden?: boolean | null;
  username: string;
  section: string;
  album: string;
  name: string;
  prefetchImages?: string[] | null;
};

export default function Lightbox({
  onClose,
  onPrev,
  onNext,
  item,
}: {
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  item: LightboxContent;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Swiping drags the strip of photos along with your finger — leftward brings
  // the next one in. Pinching in dismisses, mirroring the pinch-out that opened
  // the lightbox from a thumb.
  useGestures(dialogRef, { onSwipeLeft: onNext, onSwipeRight: onPrev, onPinchIn: onClose });

  // Only genuine empty space dismisses: the backdrop itself, or the gutter
  // around the photo. Clicks that land on the photo, its header, or a control
  // have a different target and are left alone.
  const handleEmptySpaceClick = (evt: ReactMouseEvent<HTMLDivElement>) => {
    if (evt.target === evt.currentTarget) onClose();
  };

  return (
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

      <div className={styles.lightboxContent} onMouseDown={handleEmptySpaceClick}>
        <Header content={item} />
        {item.prefetchImages?.length ? (
          item.prefetchImages.map((image, index) => (
            <img
              key={image}
              className={styles.lightboxImage}
              src={image}
              alt={item.title || ''}
              // The first image is what morphs out of the thumb and slides
              // between items; the rest ride along in the root snapshot.
              style={index === 0 ? { viewTransitionName: HERO_NAME } : undefined}
            />
          ))
        ) : (
          <F defaultMessage="Loading…" />
        )}
      </div>
    </div>
  );
}
