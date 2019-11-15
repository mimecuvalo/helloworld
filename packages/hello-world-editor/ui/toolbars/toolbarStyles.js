import { createUseStyles } from 'react-jss';

const toolbarStyles = {
  position: 'absolute',
  left: '50%',
  transform: 'translate(-50%) scale(0)',
  background: '#1b2733',
  borderRadius: '4px',
  boxShadow: '0 0 0 1px #000, 0 8px 16px rgba(27, 39, 51, 0.16)',
  zIndex: '2',
  boxSizing: 'border-box'
};

/* TODO(mime): need to use variables here */
export const styles = {
  active: {},
  toolbar: {
    extend: toolbarStyles,
    '&, & input': {
      minHeight: '40px'
    },
    '& input': {
      border: '0',
      borderRadius: '4px',
      outline: '0',
      padding: '6px 12px',
      fontSize: '14px',
      color: '#0070e0'
    },
  },
  alignmentTool: {
    extend: toolbarStyles
  },
  materialUIToolbar: {
    minHeight: '40px !important'
  },
  separator: {
    display: 'inline-block',
    borderRight: '1px solid #000',
    height: '40px',
    margin: '0'
  },
  buttonWrapper: {
    display: 'inline-block',
    verticalAlign: 'top'
  },
  button: {
    'button.&': {
      color: '#c1c7cd',
      border: '0',
      padding: '0 8px',
      minWidth: '0',
      borderRadius: '0',
      cursor: 'pointer',
      height: '32px',
      '& svg': {
        fill: 'currentColor'
      },
      '&:first-child': {
        borderTopLeftRadius: '4px',
        borderBottomLeftRadius: '4px'
      },
      '&:last-child': {
        borderTopRightRadius: '4px',
        borderBottomRightRadius: '4px'
      },
      '&, &:hover, &:focus': {
        background: '#1b2733',
        outline: '0'
      },
      '&:hover, &$active': {
        color: '#fff'
      },
    }
  },
  insertImageForm: {
    display: 'none'
  }
};

export const useStyles = createUseStyles(styles);
