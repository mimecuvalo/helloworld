import { createTheme } from '@mui/material/styles';

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
        border: `1px solid ${palette.primary.light}`,
        boxShadow: `
          1px 1px ${palette.primary.light},
          2px 2px ${palette.primary.light},
          3px 3px ${palette.primary.light}`,
        borderRadius: 0,
        color: palette.text?.primary,
        padding: referenceTheme.spacing(0, 1),
        transition: 'all 0.2s ease-out',

        '&:hover': {
          border: `1px solid ${palette.primary.main}`,
          boxShadow: `
            1px 1px ${palette.primary.main},
            2px 2px ${palette.primary.main},
            3px 3px ${palette.primary.main}`,
        },

        '&:active,&.nl-pressed': {
          boxShadow: `none`,
          transform: 'translate(3px, 3px)',
        },

        '&.Mui-disabled': {
          color: palette.text?.disabled,
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

  MuiIconButton: {
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
        border: `1px solid ${palette.primary.light}`,
        boxShadow: `
          1px 1px ${palette.primary.light},
          2px 2px ${palette.primary.light},
          3px 3px ${palette.primary.light}`,
        borderRadius: 0,
        color: palette.text?.primary,
        padding: referenceTheme.spacing(0, 1),
        transition: 'all 0.2s ease-out',

        '&:hover': {
          border: `1px solid ${palette.primary.main}`,
          boxShadow: `
            1px 1px ${palette.primary.main},
            2px 2px ${palette.primary.main},
            3px 3px ${palette.primary.main}`,
        },

        '&:active,&.Mui-selected': {
          boxShadow: `none`,
          transform: 'translate(3px, 3px)',
        },

        '&.Mui-disabled': {
          color: palette.text?.disabled,
        },
      },

      colorError: {
        background: palette.background?.default,
        border: `1px solid ${palette.error.light}`,
        boxShadow: `
          1px 1px ${palette.error.light},
          2px 2px ${palette.error.light},
          3px 3px ${palette.error.light}`,

        '&:hover': {
          background: palette.background?.default,
          border: `1px solid ${palette.error.main}`,
          boxShadow: `
            1px 1px ${palette.error.main},
            2px 2px ${palette.error.main},
            3px 3px ${palette.error.main}`,
        },
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
        borderColor: palette.primary.light,
        borderRadius: 0,
      },
    },
  },

  MuiToggleButton: {
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
        border: `1px solid ${palette.primary.light}`,
        boxShadow: `
          1px 1px ${palette.primary.light},
          2px 2px ${palette.primary.light},
          3px 3px ${palette.primary.light}`,
        borderRadius: 0,
        color: palette.text?.primary,
        padding: referenceTheme.spacing(0, 1),
        transition: 'all 0.2s ease-out',

        '&:hover': {
          border: `1px solid ${palette.primary.main}`,
          boxShadow: `
            1px 1px ${palette.primary.main},
            2px 2px ${palette.primary.main},
            3px 3px ${palette.primary.main}`,
        },

        '&:active,&.Mui-selected': {
          boxShadow: `none`,
          transform: 'translate(3px, 3px)',
        },
      },
    },
  },

  MuiTypography: {
    styleOverrides: {
      h1: {
        lineHeight: 1,
      },
    },
  },
};

export default components;
