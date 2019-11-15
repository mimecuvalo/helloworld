import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  message: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },

  emoji: {
    fontSize: '128px',
    height: '128px',
    width: '128px',
    lineHeight: '140px',
  },

  emojiSpin: {
    fontSize: '128px',
    height: '128px',
    width: '128px',
    lineHeight: '140px',
    animation: '$spin 3s linear 1 1.5s forwards',
  },

  '@keyframes spin': {
    '100%': {
      transform: 'rotate(180deg)',
    },
  },
});

export default useStyles;
