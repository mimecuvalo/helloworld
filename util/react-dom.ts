import type { renderToString as _renderToString } from 'react-dom/server';

export let renderToString: typeof _renderToString;
import('react-dom/server').then((module) => {
  renderToString = module.renderToString;
});
