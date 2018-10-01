import { configure } from '@storybook/react';

function loadStories() {
  require('../client/styleguide');
}

configure(loadStories, module);
