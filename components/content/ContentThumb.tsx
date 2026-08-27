import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'i18n';
import { contentUrl, thumbUrl } from 'lib/url-factory';
import styles from './content.module.css';

type ThumbItem = {
  title?: string | null;
  thumb: string;
  forceRefresh?: boolean | null;
  hidden?: boolean | null;
  username: string;
  section: string;
  album: string;
  name: string;
  prefetchImages?: string[] | null;
};

const messages = defineMessages({
  thumbnail: { defaultMessage: 'thumbnail' },
});

export default function ContentThumb({
  item,
  currentContent,
  onOpen,
}: {
  item: ThumbItem;
  currentContent?: { forceRefresh?: boolean | null } | null;
  onOpen: () => void;
}) {
  const intl = useIntl();
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // Cached images can finish loading before onLoad attaches — catch that so the
  // thumb doesn't stay stuck at opacity 0.
  useEffect(() => {
    if (imgRef.current?.complete) setIsLoaded(true);
  }, []);

  const forceRefresh = item.forceRefresh || currentContent?.forceRefresh;
  const thumbAlt = intl.formatMessage(messages.thumbnail);
  const isPhotosSectionAndHasPhotos = item.section === 'photos' && !!item.prefetchImages?.length;

  const handleClick = (evt: MouseEvent) => {
    if (!isPhotosSectionAndHasPhotos) return;
    evt.preventDefault();
    onOpen();
  };

  return (
    <a
      href={contentUrl(item)}
      className={styles.thumbLink}
      title={item.title || undefined}
      target={forceRefresh ? '_self' : undefined}
      onClick={handleClick}
    >
      <img
        ref={imgRef}
        className={styles.thumb}
        loading="lazy"
        src={thumbUrl(item.thumb)}
        alt={thumbAlt}
        onLoad={() => setIsLoaded(true)}
        style={{ opacity: isLoaded ? 1 : 0 }}
      />
    </a>
  );
}
