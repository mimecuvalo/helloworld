import { PaletteOptions } from '@mui/material';

const primary = {
  light: '#eae9ff',
  main: '#4642ff',
  dark: '#16147f',
};

const secondary = {
  light: '#fff8e0',
  main: '#f9d65b',
  dark: '#f2c72e',
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
  main: '#ec1000',
  dark: '#ed0900',
};

const warning = {
  light: '#fff0dc',
  main: '#ffb450',
  dark: '#ff7830',
};

const success = {
  light: '#e5f6f0',
  main: '#00aa70',
  dark: '#00774e',
};

const info = {
  light: '#7798fc',
  main: '#3567fd',
  dark: '#002cb4',
};

const basics = {
  white: '#ffffff',
  faintTransparentGrey: 'rgba(0, 0, 0, 0.04)',
  transparentGrey: 'rgba(0, 0, 0, 0.1)',
  transparentBlack: 'rgba(0, 0, 0, 0.75)',
  black: '#000',
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
    primary: basics.black,
    secondary: grey['700'],
    disabled: grey['500'],
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
