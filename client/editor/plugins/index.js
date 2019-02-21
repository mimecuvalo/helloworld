import Anchor, { anchorStrategy, AnchorDecorator } from './Anchor';
import { compose } from 'draft-extend';
import { CompositeDecorator } from 'draft-js';
import Iframe, { iframeBlockRendererFn } from './Iframe';
import Image, { imageBlockRendererFn } from './Image';

export default compose(
  Anchor,
  Iframe,
  Image
);

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
export const blockRenderers = accumulateFunction(iframeBlockRendererFn, imageBlockRendererFn);
