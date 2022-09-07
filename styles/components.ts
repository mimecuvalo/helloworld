const components = {
  MuiButton: {
    root: {
      fontSize: '13px',
      lineHeight: '1.5',
      fontWeight: '400',
      margin: '0 3px 6px 3px',
      padding: '0 7px',
      textTransform: 'none',
    },

    containedPrimary: {
      backgroundColor: '#eff',
      border: '1px solid #0c0',
      borderRadius: '3px',
      color: '#060',
      textShadow: '0 1px 0 #fff',
      boxShadow: 'none',

      '&:hover, &:active': {
        backgroundColor: '#eff',
        border: '1px solid #090',
        color: '#060',
        boxShadow: 'none',
      },
    },
  },
};

export default components;
