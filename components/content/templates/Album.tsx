import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F } from 'i18n';
import { useCollection } from 'lib/content-queries';
import { contentUrl } from 'lib/url-factory';
import { useEditor } from 'lib/editor-context';
import { rpc } from 'lib/rpc';
import { withViewTransition } from 'lib/view-transition';
import ContentThumb from '../ContentThumb';
import Lightbox, { HERO_NAME } from '../Lightbox';
import styles from '../content.module.css';

type AlbumContent = {
  username: string;
  section: string;
  album: string;
  name: string;
  forceRefresh?: boolean | null;
};

// How long we'll wait for the next image to decode before animating anyway —
// past this the slide is better than the stall.
const DECODE_BUDGET_MS = 300;

export default function Album({ content }: { content: AlbumContent }) {
  const { isEditing } = useEditor();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { username, section, album, name } = content;
  const { data, isPending } = useCollection({ username, section, album, name });
  const [currentIndexOpen, setCurrentIndexOpen] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  // Mirrors `currentIndexOpen` for callbacks that run after a transition, past
  // the point where their closure's copy is still trustworthy.
  const openIndexRef = useRef(-1);
  // Which thumb currently carries the hero `view-transition-name`, if any.
  const heroThumbIndexRef = useRef(-1);
  const collection = data || [];
  const currentItem = collection[currentIndexOpen];
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

  // The hero name has to be on the thumb *before* the browser snapshots the old
  // state, and off it again once the lightbox image claims the name — two
  // elements sharing one name aborts the transition. Moving it imperatively
  // keeps it out of React's commit, which happens too late to be captured.
  const setHeroThumb = (index: number) => {
    if (heroThumbIndexRef.current === index) return;
    const previous =
      heroThumbIndexRef.current === -1
        ? null
        : listRef.current?.querySelector<HTMLImageElement>(`[data-index="${heroThumbIndexRef.current}"] img`);
    if (previous) previous.style.viewTransitionName = '';
    heroThumbIndexRef.current = index;
    if (index === -1) return;
    const next = listRef.current?.querySelector<HTMLImageElement>(`[data-index="${index}"] img`);
    if (next) next.style.viewTransitionName = HERO_NAME;
  };

  // An undecoded image snapshots blank, so the animation would morph into an
  // empty box and then pop. Wait for it, but not for long.
  const decodeHero = (index: number) => {
    const src = collection[index]?.prefetchImages?.[0];
    if (!src) return Promise.resolve();
    const image = new Image();
    image.src = src;
    return Promise.race([
      image.decode().catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, DECODE_BUDGET_MS)),
    ]);
  };

  const showItem = (index: number) => {
    const item = collection[index];
    if (!item) return;
    // Prefetch neighbor images for snappy swiping.
    collection[index + 1]?.prefetchImages?.forEach((img) => (new Image().src = img));
    collection[index - 1]?.prefetchImages?.forEach((img) => (new Image().src = img));
    silentReplace(contentUrl(item));
    openIndexRef.current = index;
    setCurrentIndexOpen(index);
  };

  const openItem = async (index: number) => {
    if (!collection[index]) return;
    await decodeHero(index);
    setHeroThumb(index);
    withViewTransition('open', () => {
      showItem(index);
      setHeroThumb(-1);
    });
  };

  const closeItem = () => {
    const index = currentIndexOpen;
    openIndexRef.current = -1;
    withViewTransition('close', () => {
      silentReplace(contentUrl(content));
      setCurrentIndexOpen(-1);
      setHeroThumb(index);
    }).finally(() => {
      // Leave the name in place if something reopened while we were animating.
      if (openIndexRef.current === -1) setHeroThumb(-1);
    });
  };

  const goToItem = async (index: number, kind: 'next' | 'prev') => {
    if (index === currentIndexOpen || !collection[index]) return;
    await decodeHero(index);
    withViewTransition(kind, () => showItem(index));
  };

  const handleNext = () => goToItem(currentIndexOpen + 1, 'next');
  const handlePrev = () => goToItem(currentIndexOpen - 1, 'prev');

  // Deliberately re-subscribed every render: the handlers close over the open
  // index, and there's nothing to listen for while the lightbox is shut.
  useEffect(() => {
    if (currentIndexOpen === -1) return;
    const onKey = (evt: KeyboardEvent) => {
      if (evt.key === 'ArrowLeft') handlePrev();
      else if (evt.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  });

  if (isPending) return <div className={styles.loadingBox} />;

  return (
    <>
      <ul ref={listRef} className={`${styles.album} ${styles.albumGrid}`}>
        {!collection.length ? (
          <li>
            <F defaultMessage="No content here yet." />
          </li>
        ) : null}
        {collection.map((item, index) => (
          <li key={item.name} className={styles.albumItem} data-index={index}>
            <ContentThumb item={item} currentContent={content} onOpen={() => openItem(index)} />
            {item.title ? (
              <span
                className={`hw-album-title notranslate ${styles.albumTitle} ${item.hidden ? styles.albumTitleHidden : ''}`}
              >
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

      {currentItem ? <Lightbox onClose={closeItem} onPrev={handlePrev} onNext={handleNext} item={currentItem} /> : null}
    </>
  );
}
