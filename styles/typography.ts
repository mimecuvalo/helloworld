import { spacing } from './constants';

const SYSTEM_FONTS =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif, var(--font-noto-color-emoji), "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
const MONOSPACE_FONTS =
  'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace, var(--font-noto-color-emoji), "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

const constants = {
  fontFamily: MONOSPACE_FONTS,
  fontFamilyHeader: `var(--font-press-start-2p), ${SYSTEM_FONTS}`,
  fontMonospace: MONOSPACE_FONTS,

  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,

  // NB: These are only meant to be used in conjunction with font sizes below.
  lineHeightXS: '1.5',
  lineHeightSM: '1.5',
  lineHeightBase: '1.5',
  lineHeightMD: '1.2',
  lineHeightLG: '1.2',
  lineHeightXL: '1.1',

  // Font sizes (in rems)
  fontSizeXS: '0.75rem',
  fontSizeSM: '0.875rem',
  fontSizeBase: '1rem',
  fontSizeMD: '1.1rem',
  fontSizeLG: '1.25rem',
  fontSizeXL: '1.25rem',
};

const typography = {
  ...constants,
};
export default typography;

export const muiTypography = {
  fontFamily: typography.fontFamily,
  h1: {
    fontFamily: typography.fontFamilyHeader,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeXL,
    lineHeight: typography.lineHeightXL,
    marginTop: spacing(1),
    marginBottom: spacing(1),
  },
  h2: {
    fontFamily: typography.fontFamilyHeader,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeLG,
    lineHeight: typography.lineHeightLG,
    marginTop: spacing(1),
    marginBottom: spacing(1),
  },
  h3: {
    fontFamily: typography.fontFamilyHeader,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeMD,
    lineHeight: typography.lineHeightMD,
    marginTop: spacing(1),
    marginBottom: spacing(1),
  },
  h4: {
    fontFamily: typography.fontFamilyHeader,
    fontWeight: typography.fontWeightBold,
    fontSize: typography.fontSizeBase,
    lineHeight: typography.lineHeightBase,
    marginTop: spacing(1),
    marginBottom: spacing(1),
  },
  body1: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightRegular,
    fontSize: typography.fontSizeBase,
    lineHeight: typography.lineHeightBase,
  },
  body2: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightRegular,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.lineHeightSM,
  },
  overline: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightMedium,
    fontSize: typography.fontSizeXS,
    lineHeight: typography.lineHeightXS,
  },
  subtitle1: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightRegular,
    fontSize: typography.fontSizeXS,
    lineHeight: typography.lineHeightXS,
  },
  subtitle2: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightRegular,
    fontSize: typography.fontSizeXS,
    lineHeight: typography.lineHeightXS,
  },
};
