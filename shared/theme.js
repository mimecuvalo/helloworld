import { createMuiTheme } from '@material-ui/core/styles';

// Tweak to your own color scheme.
export const Color = {};

const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
});

export default theme;
