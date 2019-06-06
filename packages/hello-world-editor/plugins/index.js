import './Divider.css';
import './Focus.css';
import './Hashtag.css';
import Anchor, { anchorStrategy, AnchorDecorator } from './Anchor';
import { compose } from 'draft-extend';
import { composeDecorators } from 'draft-js-plugins-editor';
import { CompositeDecorator } from 'draft-js'; // so many ways to compose O_o
import createAlignmentPlugin from 'draft-js-alignment-plugin';
import createBlockDndPlugin from 'draft-js-drag-n-drop-plugin';
import createDividerPlugin from 'draft-js-divider-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import Iframe, { iframeBlockRendererFn } from './Iframe';
import Image, { imageBlockRendererFn } from './Image';
import toolbarStyles from '../ui/toolbars/Toolbar.module.css';

export const alignmentPlugin = createAlignmentPlugin({
  theme: { alignmentToolStyles: toolbarStyles, buttonStyles: toolbarStyles },
});
export const blockDndPlugin = createBlockDndPlugin();
export const focusPlugin = createFocusPlugin();

export default compose(
  Anchor,
  Iframe,
  Image
);

const componentDecorators = composeDecorators(
  alignmentPlugin.decorator,
  blockDndPlugin.decorator,
  focusPlugin.decorator
);

export const dividerPlugin = createDividerPlugin({ decorator: componentDecorators });

export const decorator = new CompositeDecorator([{ strategy: anchorStrategy, component: AnchorDecorator }]);

// TODO(mime): this is pulled from draft-extend until we use draft-extend directly.
function accumulateFunction(newFn, acc) {
  return function() {
    var result = newFn.apply(undefined, arguments);
    if (result === null || result === undefined) {
      return acc.apply(undefined, arguments);
    }
    return result;
  };
}

// TODO(mime): convert this to use draft-extend functionality.
export const blockRenderers = accumulateFunction(
  iframeBlockRendererFn(componentDecorators),
  imageBlockRendererFn(componentDecorators)
);
