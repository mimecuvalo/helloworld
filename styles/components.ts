import { SimplePaletteColorOptions, createTheme } from '@mui/material/styles';

import palette from './palette';
import typography from './typography';

// Reference theme:
const referenceTheme = createTheme();

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

      contained: {
        background: palette.background?.default,
        border: `1px solid ${(palette.primary as SimplePaletteColorOptions)?.light}`,
        boxShadow: `
          1px 1px ${(palette.primary as SimplePaletteColorOptions)?.light},
          2px 2px ${(palette.primary as SimplePaletteColorOptions)?.light},
          3px 3px ${(palette.primary as SimplePaletteColorOptions)?.light}`,
        borderRadius: 0,
        color: palette.text?.primary,
        padding: referenceTheme.spacing(0, 1),

        '&:hover': {
          boxShadow: `
            1px 1px ${(palette.primary as SimplePaletteColorOptions)?.light},
            2px 2px ${(palette.primary as SimplePaletteColorOptions)?.light},
            3px 3px ${(palette.primary as SimplePaletteColorOptions)?.light}`,
        },
      },
    },
  },

  MuiChip: {
    styleOverrides: {
      labelSmall: {
        fontSize: typography.fontSizeXS,
        padding: referenceTheme.spacing(0, 0.5),
      },

      sizeSmall: {
        height: '14px',
      },
    },
  },

  MuiList: {
    styleOverrides: {
      root: {
        margin: 0,
        padding: 0,
      },
    },
  },

  MuiListItem: {
    styleOverrides: {
      root: {
        margin: 0,
        padding: 0,
      },
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      notchedOutline: {
        borderColor: (palette.primary as SimplePaletteColorOptions)?.light,
        borderRadius: 0,
      },
    },
  },
};

export default components;
