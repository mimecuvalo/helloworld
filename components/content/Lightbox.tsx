import { F } from 'i18n';
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

export default function Lightbox({
  isOpen,
  onClose,
  onPrev,
  onNext,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  item: LightboxContent;
}) {
  if (!isOpen) return null;

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
