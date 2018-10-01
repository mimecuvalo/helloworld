import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

/**
 * Setup for the Storybook styleguide component which lives at http://localhost:9001 by default.
 * Should only be run in development.
 */

// Provide some initial stubbed out 'stories' for the developer to edit.
storiesOf('Custom', module)
  .add('Colors', () => <div>Add your color palette here</div>)
  .add('Components', () => <div>Add your custom components here</div>);

// We're not going to copy all of the Material UI docs here :P
// Just provide links to the underlying libraries.
storiesOf('Material UI', module)
  .add('Demos', () => (
    <a href="https://material-ui.com/demos/app-bar/" target="_blank" rel="noopener noreferrer">
      Material UI demos
    </a>
  ))
  .add('API', () => (
    <a href="https://material-ui.com/api/app-bar/" target="_blank" rel="noopener noreferrer">
      Material UI API
    </a>
  ))
  .add('Style', () => (
    <a href="https://material-ui.com/style/icons/" target="_blank" rel="noopener noreferrer">
      Material UI style
    </a>
  ))
  .add('Layout', () => (
    <a href="https://material-ui.com/layout/basics/" target="_blank" rel="noopener noreferrer">
      Material UI layout
    </a>
  ))
  .add('Utils', () => (
    <a href="https://material-ui.com/utils/modal/" target="_blank" rel="noopener noreferrer">
      Material UI utils
    </a>
  ));
