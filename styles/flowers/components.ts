import palette from './palette';
import typography from './typography';

// Reference theme:
//const referenceTheme = createTheme();

const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        background: palette.background?.default,
        fontSize: typography.fontSizeBase,
        lineHeight: typography.lineHeightBase,
        textTransform: 'none',
        verticalAlign: 'baseline',

        '&.MuiButton-text[href]': {
          textTransform: 'none',
          padding: 0,
          minWidth: 0,
          margin: 0,
          border: 0,
        },
      },
    },
  },
};

export default components;
