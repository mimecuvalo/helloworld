import { useEffect, useRef } from 'react';
import { F } from 'i18n';
import { useGestures } from 'lib/use-gestures';
import Header from './Header';
import styles from './content.module.css';

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

type LightboxProps = {
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  item: LightboxContent;
};

export default function Lightbox({ isOpen, ...props }: LightboxProps) {
  // Every thumb in an album renders a Lightbox, so keep the hooks (and their
  // window-level listeners) in a child that only mounts while it's open.
  if (!isOpen) return null;
  return <LightboxDialog {...props} />;
}

function LightboxDialog({ onClose, onPrev, onNext, item }: Omit<LightboxProps, 'isOpen'>) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Swipe direction matches the single-photo view (see ContentPage); pinching in
  // dismisses, mirroring the pinch-out that opened the lightbox from a thumb.
  useGestures(dialogRef, { onSwipeLeft: onPrev, onSwipeRight: onNext, onPinchIn: onClose });

  return (
    <div ref={dialogRef} className={styles.lightbox} role="dialog" aria-modal="true" onClick={onClose}>
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

      <div className={styles.lightboxContent}>
        <Header content={item} />
        {item.prefetchImages?.length ? (
          item.prefetchImages.map((image) => (
            <img key={image} className={styles.lightboxImage} src={image} alt={item.title || ''} />
          ))
        ) : (
          <F defaultMessage="Loading…" />
        )}
      </div>
    </div>
  );
}
