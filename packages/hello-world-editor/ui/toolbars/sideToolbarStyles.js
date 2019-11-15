import { createUseStyles } from 'react-jss';

export const styles = {
  blockType: {
    boxSizing: 'border-box',
    boxShadow: '0 0 0 1px #000, 0 8px 16px rgba(27, 39, 51, 0.16)',
    background: '#1b2733',
    padding: '5px',
    margin: '0',
    borderRadius: '18px',
    cursor: 'pointer',
    height: '36px',
    width: '36px',
    lineHeight: '36px',
    textAlign: 'center',
    '& svg': {
      fill: '#fff'
    },
  },
  spacer: {
    position: 'absolute',
    top: '-1px',
    left: '50%',
    transform: 'translate(-50%)',
    width: '74px',
    height: '50px'
  },
  popup: {
    position: 'absolute',
    left: '50%',
    transform: 'translate(-50%)',
    background: '#1b2733',
    borderRadius: '2px',
    boxShadow: '0 0 0 1px #000, 0 8px 16px rgba(27, 39, 51, 0.16)',
    zIndex: '3',
    boxSizing: 'border-box',
    width: '80px',
    marginTop: '8px'
  },
  materialUIToolbar: {
    'div.&': {
      display: 'block'
    }
  },
  wrapper: {
    position: 'absolute',
    marginLeft: '-30px',
    zIndex: '1'
  }
};

export const useStyles = createUseStyles(styles);