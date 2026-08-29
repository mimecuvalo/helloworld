import { type MouseEvent, useRef } from 'react';
import { defineMessages, useIntl } from 'i18n';
import { lqipStyle } from 'lib/lqip';
import { contentUrl, thumbUrl } from 'lib/url-factory';
import { useGestures } from 'lib/use-gestures';
import { THUMB_HEIGHT, THUMB_WIDTH } from 'util/constants';
import styles from './content.module.css';

type ThumbItem = {
  title?: string | null;
  thumb: string;
  lqip?: number | null;
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
  const linkRef = useRef<HTMLAnchorElement>(null);

  const forceRefresh = item.forceRefresh || currentContent?.forceRefresh;
  const thumbAlt = intl.formatMessage(messages.thumbnail);
  const isPhotosSectionAndHasPhotos = item.section === 'photos' && !!item.prefetchImages?.length;

  const handleOpen = () => {
    if (!isPhotosSectionAndHasPhotos) return;
    onOpen();
  };

  const handleClick = (evt: MouseEvent) => {
    if (!isPhotosSectionAndHasPhotos) return;
    evt.preventDefault();
    handleOpen();
  };

  // Pinching out on a thumb blows it up into the lightbox; the lightbox closes
  // on the reverse pinch.
  useGestures(linkRef, { onPinchOut: handleOpen });

  return (
    <a
      ref={linkRef}
      href={contentUrl(item)}
      className={styles.thumbLink}
      title={item.title || undefined}
      target={forceRefresh ? '_self' : undefined}
      onClick={handleClick}
    >
      {/* No fade-in: the placeholder underneath is what the thumb fades up
          from, and fading the <img> would take its own background with it.
          The dimensions are the box that placeholder is painted in. */}
      <img
        className={styles.thumb}
        loading="lazy"
        src={thumbUrl(item.thumb)}
        alt={thumbAlt}
        width={THUMB_WIDTH}
        height={THUMB_HEIGHT}
        style={lqipStyle(item.lqip)}
      />
    </a>
  );
}
