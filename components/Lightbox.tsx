import { Dialog, IconButton } from 'components';

import { ArrowBackIosNew, ArrowForwardIos, Close } from '@mui/icons-material';
import { Backdrop, styled, useTheme } from '@mui/material';
import Header from './content/Header';
import { Content } from 'data/graphql-generated';

const DialogImage = styled('img')`
  max-height: 80vh;
  max-width: 100%;

  &:not(:last-child) {
    margin-bottom: ${(props) => props.theme.spacing(1)};
  }
`;

const DialogContent = styled('div')`
  header {
    position: fixed;
    align-self: center;
  }
`;

export default function Lightbox({
  isDialogOpen,
  handleClose,
  handlePrev,
  handleNext,
  item,
}: {
  isDialogOpen: boolean;
  handleClose: () => void;
  handlePrev: () => void;
  handleNext: () => void;
  item: Content;
}) {
  const theme = useTheme();

  return (
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
          margin: theme.spacing(1),
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        size="large"
        sx={{
          backgroundColor: 'black',
          position: 'fixed',
          top: { xs: theme.spacing(1), md: theme.spacing(4) },
          right: { xs: theme.spacing(1), md: theme.spacing(4) },
          padding: theme.spacing(1),
          '&:hover': {
            backgroundColor: 'black',
          },
        }}
      >
        <Close width={32} height={32} />
      </IconButton>

      <IconButton
        onClick={handlePrev}
        size="large"
        sx={{
          backgroundColor: 'black',
          position: 'fixed',
          transform: { xs: 'translateY(0)', md: 'translateY(-50%)' },
          bottom: { xs: theme.spacing(1), md: '50%' },
          left: { xs: `calc(50% - ${theme.spacing(7)})`, md: theme.spacing(4) },
          padding: theme.spacing(1),
          '&:hover': {
            backgroundColor: 'black',
          },
          '&:active': {
            transform: { xs: 'translateY(3px) translateX(3px)', md: 'translateY(calc(-50% + 3px)) translateX(3px)' },
          },
        }}
      >
        <ArrowBackIosNew width={32} height={32} />
      </IconButton>

      <IconButton
        onClick={handleNext}
        size="large"
        sx={{
          backgroundColor: 'black',
          position: 'fixed',
          transform: { xs: 'translateY(0)', md: 'translateY(-50%)' },
          bottom: { xs: theme.spacing(1), md: '50%' },
          right: { xs: `calc(50% - ${theme.spacing(7)})`, md: theme.spacing(4) },
          padding: theme.spacing(1),
          '&:hover': {
            backgroundColor: 'black',
          },
          '&:active': {
            transform: { xs: 'translateY(3px) translateX(3px)', md: 'translateY(calc(-50% + 3px)) translateX(3px)' },
          },
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
        {item.prefetchImages?.map((image) => (
          <DialogImage key={image} src={image} alt={item.title} />
        ))}
        {/* <Simple content={item} /> */}
      </DialogContent>
    </Dialog>
  );
}
