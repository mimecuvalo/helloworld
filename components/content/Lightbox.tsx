import { F } from 'i18n';
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
  return (
    <div className={styles.lightbox} role="dialog" aria-modal="true">
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

      <div className={styles.lightboxContent} onClick={onClose}>
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
