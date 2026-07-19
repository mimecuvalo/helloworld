import { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F } from 'i18n';
import { useCollection } from 'lib/content-queries';
import { contentUrl } from 'lib/url-factory';
import { useEditor } from 'lib/editor-context';
import { rpc } from 'lib/rpc';
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
  const { isEditing } = useEditor();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { username, section, album, name } = content;
  const { data, isPending } = useCollection({ username, section, album, name });
  const [currentIndexOpen, setCurrentIndexOpen] = useState(-1);
  const collection = data || [];
  const deleteMutation = useMutation({
    mutationFn: (itemName: string) =>
      rpc.api.content.delete.$post({ json: { name: itemName } }).then((response) => {
        if (!response.ok) throw new Error('delete failed');
        return response.json();
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collection'] }),
  });

  // Update the address bar without the router matching/loading the new route.
  // TanStack's history patches window.history.replaceState and notifies the
  // router unless `_ignoreSubscribers` is set — the same flag its own flush uses.
  const silentReplace = (url: string) => {
    const history = router.history as typeof router.history & { _ignoreSubscribers?: boolean };
    history._ignoreSubscribers = true;
    window.history.replaceState(window.history.state, '', url);
    history._ignoreSubscribers = false;
  };

  const setItem = (index: number) => {
    const item = collection[index];
    if (!item) return;
    // Prefetch neighbor images for snappy swiping.
    collection[index + 1]?.prefetchImages?.forEach((img) => (new Image().src = img));
    collection[index - 1]?.prefetchImages?.forEach((img) => (new Image().src = img));
    silentReplace(contentUrl(item));
    setCurrentIndexOpen(index);
  };

  const closeItem = () => {
    silentReplace(contentUrl(content));
    setCurrentIndexOpen(-1);
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
            onClose={closeItem}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          {item.title ? (
            <span className={`notranslate ${styles.albumTitle} ${item.hidden ? styles.albumTitleHidden : ''}`}>
              {item.title}
            </span>
          ) : null}
          {isEditing ? (
            <button
              type="button"
              className="btn"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(item.name)}
            >
              <F defaultMessage="Delete" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
