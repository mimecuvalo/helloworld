// Matches how Material-UI does spacing
export const spacing = (factor: number): string => `${factor * 8}px`;

export const shape = {
  borderRadius: 4,
};

export const breakpoints = {
  // These match Material-UI but if we ever wanted to switch, we can change it here.
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

// The order of these defines which one 'wins' to be on top of the other.
// This simplifies guessing a number and just assigns number in sequential order.
// (excepting belowPage, page, abovePage, and important which are special z-indices)
const zIndices: { [key: string]: string } = {
  // Special cases
  belowPage: '-1',
  page: '0',
  abovePage: '1',

  // Register custom z-indices here, they will get auto-populated with the correct value:
  popup: '0',
  abovePageShadow: '0',
  loading: '0',
  navigation: '0',
  datePickers: '0',
  notificationContainer: '0',

  // At same level as Material-UI modal, https://material-ui.com/customization/z-index/
  // TODO(mime): we can configure Material z-indices instead of us working with them.
  modalOverlay: '1300',

  // Special case
  important: '2147483647',
};
Object.keys(zIndices).forEach((item, index) => {
  if (zIndices[item] === '0' && item !== 'page') {
    zIndices[item] = (index - parseInt(zIndices['abovePage'])).toString();
  }
});

export const zindex = zIndices;
