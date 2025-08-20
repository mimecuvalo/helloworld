import { Link, styled } from 'components';
import { THUMB_HEIGHT, THUMB_WIDTH } from 'util/constants';
import { contentUrl } from 'util/url-factory';
import { defineMessages, useIntl } from 'i18n';

import { Content } from 'data/graphql-generated';
import { MouseEvent, useEffect, useState } from 'react';
import Image from 'components/Image';
import Lightbox from './Lightbox';

const ThumbLink = styled(Link)`
  width: ${THUMB_WIDTH}px;
  height: ${THUMB_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledThumb = styled('img')`
  display: inline-block;
  width: ${THUMB_WIDTH}px;
  height: ${THUMB_HEIGHT}px;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
`;

const messages = defineMessages({
  thumbnail: { defaultMessage: 'thumbnail' },
});

export default function Thumb({
  className,
  item,
  currentContent: currentContentProp,
  isOpen,
  onOpen,
  onClose,
  handlePrev,
  handleNext,
}: {
  className?: string;
  item: Content;
  currentContent?: Content;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  handlePrev: () => void;
  handleNext: () => void;
}) {
  const intl = useIntl();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => setIsDialogOpen(isOpen), [isOpen]);

  const currentContent = currentContentProp || { forceRefresh: false };
  const thumbAltText = intl.formatMessage(messages.thumbnail);

  const thumb =
    // TODO(mime): is loading lazy necessary here for next.js? i forget
    item.thumb.startsWith('/resource') ? (
      <Image
        loading="lazy"
        src={
          item.thumb
            ? item.thumb.startsWith('/resource')
              ? `https://${process.env.NEXT_PUBLIC_S3_AWS_S3_BUCKET_NAME}${item.thumb.replace('/resource', '')}`
              : item.thumb
            : '/img/pixel.gif'
        }
        onLoad={() => setIsLoaded(true)}
        width={THUMB_WIDTH}
        height={THUMB_HEIGHT}
        alt={thumbAltText}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          objectFit: 'cover',
        }}
      />
    ) : (
      <StyledThumb
        loading="lazy"
        src={item.thumb || '/img/pixel.gif'}
        alt={thumbAltText}
        onLoad={() => setIsLoaded(true)}
        style={{ opacity: isLoaded ? 1 : 0 }}
      />
    );

  const handleClick = (evt: MouseEvent) => {
    evt.preventDefault();

    setIsDialogOpen(true);
    onOpen();
  };
  const handleClose = () => {
    setIsDialogOpen(false);
    onClose();
  };

  const isPhotosSectionAndHasPhotos = item.section === 'photos' && !!item.prefetchImages?.length;

  return (
    <>
      <ThumbLink
        href={contentUrl(item)}
        className={className}
        title={item.title}
        target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
        onClick={isPhotosSectionAndHasPhotos ? handleClick : undefined}
      >
        {thumb}
      </ThumbLink>

      {isPhotosSectionAndHasPhotos && (
        <Lightbox
          isDialogOpen={isDialogOpen}
          handleClose={handleClose}
          handlePrev={handlePrev}
          handleNext={handleNext}
          item={item}
        />
      )}
    </>
  );
}
