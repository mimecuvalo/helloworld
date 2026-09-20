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
  template?: string | null;
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
  // The lightbox is only ever right for an item that is nothing but its photos,
  // because all it shows is the images — everything that made the page is left
  // behind. Two kinds of item are more than that: a blank template, which is a
  // page of its own body and nothing else, and one whose rendering leans on
  // custom style, code or a <script>, which is what `forceRefresh` already
  // marks. For those the click belongs to the link. `item.forceRefresh` and
  // not the value above: that one folds in the album's own flag, which says
  // nothing about the item inside it.
  const opensInLightbox =
    item.section === 'photos' && item.template !== 'blank' && !item.forceRefresh && !!item.prefetchImages?.length;

  const handleOpen = () => {
    if (!opensInLightbox) return;
    onOpen();
  };

  const handleClick = (evt: MouseEvent) => {
    if (!opensInLightbox) return;
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
