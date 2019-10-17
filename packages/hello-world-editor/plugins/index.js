import './Divider.css';
import './Focus.css';
import './Hashtag.css';
import './Reply.css';
import './RSVP.css';
import Anchor, { anchorStrategy, AnchorDecorator } from './Anchor';
import { compose } from 'draft-extend';
import { composeDecorators } from 'draft-js-plugins-editor';
import { CompositeDecorator } from 'draft-js'; // so many ways to compose O_o
import createAlignmentPlugin from 'draft-js-alignment-plugin';
import createBlockDndPlugin from 'draft-js-drag-n-drop-plugin';
import createDividerPlugin from 'draft-js-divider-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import { createPlugin } from 'draft-extend';
import createReplyPlugin from './Reply';
import createRSVPPlugin from './RSVP';
import { decoratedBlocksToHTML } from '../utils/Blocks';
import Iframe, { iframeBlockRendererFn } from './Iframe';
import Image, { imageBlockRendererFn } from './Image';
import toolbarStyles from '../ui/toolbars/Toolbar.module.css';

export const alignmentPlugin = createAlignmentPlugin({
  theme: { alignmentToolStyles: toolbarStyles, buttonStyles: toolbarStyles },
});
export const blockDndPlugin = createBlockDndPlugin();
export const focusPlugin = createFocusPlugin();
export const hashtagPlugin = createHashtagPlugin();
export const linkifyPlugin = createLinkifyPlugin();
export const replyPlugin = createReplyPlugin();
export const rsvpPlugin = createRSVPPlugin();

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

export const htmlPlugins = compose(
  Anchor,
  Iframe,
  Image,
  // TODO(mime): enable the rest of these.
  /*dividerPlugin,
  hashtagPlugin,
  mentionPlugin,*/
  createPlugin(Object.assign(
    {},
    // TODO(mime): frankenstein stuff here b/c linkifyPlugin is 3rd party...
    {
      // This handles linkify content actually typed in (not pasted in from another editor).
      blockToHTML: decoratedBlocksToHTML(linkifyPlugin.decorators[0].strategy, linkifyPlugin.decorators[0].component),

      // This handles LINK entities (actually, unrelated to the linkify plugin, e.g. pasted in from another editor).
      entityToHTML: (entity, originalText) => {
        if (entity.type === 'LINK') {
          const { href } = entity.data;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer">${originalText}</a>`;
        }

        return originalText;
      }
    },
    linkifyPlugin
  )),
  createPlugin(replyPlugin),
  createPlugin(rsvpPlugin),
  /* TODO(mime): emojiPlugin, */
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
export const blockRenderers = accumulateFunction(
  iframeBlockRendererFn(componentDecorators),
  imageBlockRendererFn(componentDecorators)
);
