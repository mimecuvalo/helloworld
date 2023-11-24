import { Link, Dialog, styled, IconButton, useTheme } from 'components';
import { THUMB_HEIGHT, THUMB_WIDTH } from 'util/constants';
import { constructNextImageURL, contentUrl } from 'util/url-factory';
import { defineMessages, useIntl } from 'i18n';

import { Content } from 'data/graphql-generated';
import { MouseEvent, useEffect, useState } from 'react';
import { ArrowBackIosNew, ArrowForwardIos, Close } from '@mui/icons-material';
import { Backdrop } from '@mui/material';
import Header from './content/Header';
import Image from 'next/image';

const ThumbLink = styled(Link)`
  width: ${THUMB_WIDTH}px;
  height: ${THUMB_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DialogImage = styled('img')`
  max-height: 80vh;
  max-width: 100%;

  &:not(:last-child) {
    margin-bottom: ${(props) => props.theme.spacing(1)};
  }
`;

const DialogContent = styled('div')`
  header {
    align-self: center;
  }
`;

const StyledThumb = styled('img')`
  display: inline-block;
  width: ${THUMB_WIDTH}px;
  height: ${THUMB_HEIGHT}px;
  object-fit: cover;
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
  const theme = useTheme();

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
        width={THUMB_WIDTH}
        height={THUMB_HEIGHT}
        alt={thumbAltText}
        style={{
          objectFit: 'cover',
        }}
      />
    ) : (
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
        <Dialog
          open={isDialogOpen}
          onClose={handleClose}
          maxWidth="lg"
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              sx: {
                backdropFilter: 'blur(3px)',
                backgroundColor: 'rgba(0,0,30,0.4)',
              },
            },
          }}
          PaperProps={{
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              alignItems: 'center',
              width: theme.breakpoints.values.lg,
            },
          }}
        >
          <IconButton
            onClick={handleClose}
            size="large"
            sx={{
              backgroundColor: '#fff !important',
              position: 'fixed',
              top: theme.spacing(4),
              right: theme.spacing(4),
            }}
          >
            <Close width={32} height={32} />
          </IconButton>

          <IconButton
            onClick={handlePrev}
            size="large"
            sx={{
              backgroundColor: '#fff !important',
              position: 'fixed',
              marginTop: theme.spacing(-2),
              top: '50%',
              left: theme.spacing(4),
            }}
          >
            <ArrowBackIosNew width={32} height={32} />
          </IconButton>

          <IconButton
            onClick={handleNext}
            size="large"
            sx={{
              backgroundColor: '#fff !important',
              position: 'fixed',
              marginTop: theme.spacing(-2),
              top: '50%',
              right: theme.spacing(4),
            }}
          >
            <ArrowForwardIos width={32} height={32} />
          </IconButton>

          <DialogContent
            onClick={handleClose}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Header content={item} />
            {item.prefetchImages?.map((image) => <DialogImage key={image} src={image} alt={item.title} />)}
            {/* <Simple content={item} /> */}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
