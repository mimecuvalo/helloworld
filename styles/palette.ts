import { PaletteOptions } from '@mui/material';

const primary = {
  light: '#09f',
  main: '#3984ff',
  dark: '#16147f',
};

const secondary = {
  light: '#fff8e0',
  main: '#f0f',
  dark: '#90f',
};

const grey = {
  100: '#f9f9f9',
  300: '#f2f2f2',
  500: '#ccc',
  700: '#666',
  800: '#323232',
};

const error = {
  light: '#fde7e5',
  main: '#f60',
  dark: '#f00',
};

const warning = {
  light: '#fff0dc',
  main: '#f90',
  dark: '#f30',
};

const success = {
  light: '#e5f6f0',
  main: '#0c0',
  dark: '#060',
};

const info = {
  light: '#7798fc',
  main: '#0cf',
  dark: '#06f',
};

const basics = {
  white: '#ffffff',
  faintTransparentGrey: 'rgba(0, 0, 0, 0.04)',
  transparentGrey: 'rgba(0, 0, 0, 0.1)',
  transparentBlack: 'rgba(0, 0, 0, 0.75)',
  black: '#161313',
};

const accents = {};

const thirdParty = {
  facebookBlue: '#3b5998',
  googleBlue: '#4285f4',
};

const palette: PaletteOptions = {
  primary,
  secondary,
  error,
  warning,
  info,
  success,
  grey,
  text: {
    primary: basics.white,
    secondary: grey['700'],
    disabled: grey['500'],
  },
  background: {
    default: basics.black,
    paper: basics.black,
  },
};
export default palette;

// TODO(mime): redo
// export const fullPalette = {
//   ...primary,
//   ...grey,
//   ...error,
//   ...warning,
//   ...info,
//   ...success,
//   ...basics,
//   ...accents,
//   ...thirdParty,
// };

export const storybook = {
  primary,
  grey,
  error,
  warning,
  info,
  success,
  basics,
  accents,
  thirdParty,
};
