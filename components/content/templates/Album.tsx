import { useEffect, useState } from 'react';
import { F } from 'i18n';
import { useCollection } from 'lib/content-queries';
import ContentThumb from '../ContentThumb';
import styles from '../content.module.css';

type AlbumContent = {
  username: string;
  section: string;
  album: string;
  name: string;
  forceRefresh?: boolean | null;
};

export default function Album({ content }: { content: AlbumContent }) {
  const { username, section, album, name } = content;
  const { data, isPending } = useCollection({ username, section, album, name });
  const [currentIndexOpen, setCurrentIndexOpen] = useState(-1);
  const collection = data || [];

  const setItem = (index: number) => {
    const item = collection[index];
    if (!item) return;
    // Prefetch neighbor images for snappy swiping.
    collection[index + 1]?.prefetchImages?.forEach((img) => (new Image().src = img));
    collection[index - 1]?.prefetchImages?.forEach((img) => (new Image().src = img));
    // NB: the legacy did a shallow router.replace to the photo URL here; in
    // TanStack a history change navigates (unmounting the album), so we keep the
    // lightbox purely client-side and don't touch the URL.
    setCurrentIndexOpen(index);
  };

  const handleNext = () => setItem(Math.min(collection.length - 1, currentIndexOpen + 1));
  const handlePrev = () => setItem(Math.max(0, currentIndexOpen - 1));

  useEffect(() => {
    const onKey = (evt: KeyboardEvent) => {
      if (currentIndexOpen === -1) return;
      if (evt.key === 'ArrowLeft') handlePrev();
      else if (evt.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  });

  if (isPending) return <div className={styles.loadingBox} />;

  return (
    <ul className={styles.album}>
      {!collection.length ? (
        <li>
          <F defaultMessage="No content here yet." />
        </li>
      ) : null}
      {collection.map((item, index) => (
        <li key={item.name} className={styles.albumItem}>
          <ContentThumb
            item={item}
            currentContent={content}
            isOpen={currentIndexOpen === index}
            onOpen={() => setItem(index)}
            onClose={() => setCurrentIndexOpen(-1)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          {item.title ? (
            <span className={`notranslate ${styles.albumTitle} ${item.hidden ? styles.albumTitleHidden : ''}`}>
              {item.title}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
