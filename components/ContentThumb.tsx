import { Link, styled } from 'components';
import { THUMB_HEIGHT, THUMB_WIDTH } from 'util/constants';
import { constructNextImageURL, contentUrl } from 'util/url-factory';
import { defineMessages, useIntl } from 'i18n';

import { Content } from 'data/graphql-generated';

const ThumbLink = styled(Link)`
  max-width: ${THUMB_WIDTH}px;
  min-height: ${THUMB_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledThumb = styled('img')`
  display: inline-block;
  max-width: ${THUMB_WIDTH}px;
  max-height: ${THUMB_HEIGHT}px;
`;

const messages = defineMessages({
  thumbnail: { defaultMessage: 'thumbnail' },
});

export default function Thumb({
  className,
  item,
  currentContent: currentContentProp,
}: {
  className?: string;
  item: Content;
  currentContent?: Content;
}) {
  const intl = useIntl();

  const currentContent = currentContentProp || { forceRefresh: false };
  const thumbAltText = intl.formatMessage(messages.thumbnail);

  const thumb = (
    // TODO(mime): is loading lazy necessary here for next.js? i forget
    <StyledThumb
      loading="lazy"
      src={item.thumb ? constructNextImageURL(item.thumb, 640 /* size */) : '/img/pixel.gif'}
      alt={thumbAltText}
    />
  );

  // We're using the fancy new "loading" attribute for images to lazy load thumbs. Woo!
  // return !isEditing && item.externalLink ? (
  //   <ThumbLink className={className} href={item.externalLink} target="_blank">
  //     {thumb}
  //   </ThumbLink>
  // ) : (
  //   <ThumbLink
  //     href={contentUrl(item)}
  //     className={className}
  //     title={item.title}
  //     target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
  //   >
  //     {thumb}
  //   </ThumbLink>
  // );

  return (
    <ThumbLink
      href={contentUrl(item)}
      className={className}
      title={item.title}
      target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
    >
      {thumb}
    </ThumbLink>
  );
}
