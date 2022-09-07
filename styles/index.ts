import { breakpoints, shape, spacing, zindex } from './constants';

import palette from './palette';
import typography from './typography';

export { default as muiTheme, createEmotionCache } from './theme';
export * from './mixins';

const baseTheme = {
  breakpoints,
  palette,
  shape,
  spacing,
  typography,
  zindex,
};
export default baseTheme;
