import { createMuiTheme } from '@material-ui/core/styles';

// Tweak to your own color scheme.
export const Color = {};

const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  overrides: {
    MuiButton: {
      root: {
        fontSize: '13px',
        lineHeight: '1.1',
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
        backgroundImage: 'linear-gradient(to bottom, #fff 0, #e0e0e0 100%)',
        boxShadow: '1px 1px #0c0, 2px 2px #0c0, 3px 3px #0c0, 4px 4px #333, 4px 3px #333, 3px 4px #333',

        '&:hover, &:active': {
          border: '1px solid #090',
          color: '#060',
          boxShadow: '1px 1px #090, 2px 2px #090, 3px 3px #090, 4px 4px #333, 4px 3px #333, 3px 4px #333',
        },
      },
    },
  },
});

export default theme;
