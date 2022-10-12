import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  readAll: {},
  selected: {},
  remoteUsers: {
    '& li': {
      display: 'flex',
      border: '1px solid transparent',
      padding: '1px 4px',
      marginBottom: '1px',
      cursor: 'pointer',
    },
    '& $readAll': {
      borderTop: '1px solid #ccc',
      borderBottom: '1px solid #ccc',
      margin: '6px 0',
      paddingLeft: '26px',
    },
    '& li:hover,\n  & li$selected': {
      border: '1px solid hotpink',
    },
    '& li$selected': {
      fontWeight: 'bold',
    },
    '& img': {
      width: '16px',
      maxHeight: '16px',
      verticalAlign: 'text-top',
      margin: '0 5px 0 1px',
    },
    '& button:first-child': {
      flex: '1',
      height: '24px',
      lineHeight: '24px',
      display: 'inline-block',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      textAlign: 'left',
      verticalAlign: 'top',
    },
    '& button:first-child:hover': {
      textDecoration: 'none',
    },
    '& button:last-child, & li:hover $unreadCount': {
      display: 'none',
    },
    '& li:hover button:last-child': {
      display: 'inline-block',
    },
  },
  search: {
    width: '100%',
    margin: '10px 0',
    border: '1px solid #ccc',
    padding: '0px 3px',
    borderRadius: '3px',
    height: '19px',
    lineHeight: 'normal',
  },
  unreadCount: {
    lineHeight: '24px',
    maxWidth: '36px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: '#999',
    '&::before': {
      content: "'('",
    },
    '&::after': {
      content: "')'",
    },
  },
  menu: {
    'html &': {
      padding: '0',
    },
  },
});

export default useStyles;
