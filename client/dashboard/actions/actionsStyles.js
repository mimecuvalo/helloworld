import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  enabled: {
    fontWeight: 'bold',
  },
  disabled: {
    color: '#aaa',
    cursor: 'not-allowed',
  },
  newFeed: {
    width: '100%',
    marginTop: '5px',
    border: '1px solid #ccc',
    padding: '0px 3px',
    borderRadius: '3px',
    height: '19px',
    lineHeight: 'normal',
  },
});

export default useStyles;
