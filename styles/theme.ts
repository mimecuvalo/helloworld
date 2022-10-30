import { breakpoints, shape } from './constants';

import components from './components';
import createCache from '@emotion/cache';
import { createTheme } from '@mui/material';
import flowersComponents from './flowers/components';
import flowersGlobalCss from './flowers/globals';
import flowersPalette from './flowers/palette';
import { muiTypography as flowersTypography } from './flowers/typography';
import palette from './palette';
import { muiTypography as typography } from './typography';

const theme = createTheme({
  palette,
  typography,
  // @ts-ignore ah hush.
  components,
  breakpoints: {
    values: {
      ...breakpoints,
    },
  },
  shape,
});

export default theme;

const flowers = createTheme({
  palette: flowersPalette,
  typography: flowersTypography,
  // @ts-ignore ah hush.
  components: flowersComponents,
  breakpoints: {
    values: {
      ...breakpoints,
    },
  },
  shape,
});

export const themes = {
  nightlight: theme,
  flowers,
};

export const themeGlobalCss = {
  nightlight: '',
  flowers: flowersGlobalCss,
};

// prepend: true moves MUI styles to the top of the <head> so they're loaded first.
// It allows developers to easily override MUI styles with other styling solutions, like CSS modules.
export function createEmotionCache() {
  return createCache({ key: 'css', prepend: true });
}
