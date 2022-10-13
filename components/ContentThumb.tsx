import { Link, styled } from 'components';
import { defineMessages, useIntl } from 'i18n';

import { Content } from '@prisma/client';
import { contentUrl } from 'util/url-factory';

const ThumbLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--thumb-width);
  max-width: var(--thumb-width);
  min-height: var(--thumb-height);
`;

const StyledThumb = styled('img')`
  display: inline-block;
  max-width: var(--thumb-width);
  max-height: var(--thumb-height)';
`;

const messages = defineMessages({
  thumbnail: { defaultMessage: 'thumbnail' },
});

export default function Thumb({
  className,
  item,
  currentContent,
  isEditing,
}: {
  className?: string;
  item: Content;
  currentContent: Content;
  isEditing: boolean;
}) {
  const intl = useIntl();

  currentContent = currentContent || {};
  const thumbAltText = intl.formatMessage(messages.thumbnail);

  const thumb = (
    // TODO(mime): is loading lazy necessary here for next.js? i forget
    <StyledThumb loading="lazy" src={item.thumb || '/img/pixel.gif'} alt={thumbAltText} />
  );

  // We're using the fancy new "loading" attribute for images to lazy load thumbs. Woo!
  return !isEditing && item.externalLink ? (
    <ThumbLink className={className} href={item.externalLink} target="_blank">
      {thumb}
    </ThumbLink>
  ) : (
    <ThumbLink
      to={contentUrl(item)}
      className={className}
      title={item.title}
      target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
    >
      {thumb}
    </ThumbLink>
  );
}
