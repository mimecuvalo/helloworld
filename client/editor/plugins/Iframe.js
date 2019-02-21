import { createPlugin } from 'draft-extend';
import React from 'react';

const BLOCK_TYPE = 'atomic';
const ENTITY_TYPE = 'IFRAME';
const NODE_NAME = 'iframe';

// TODO(mime): one day, maybe switch wholesale to draft-extend. for now, we have a weird hybrid
// of draft-extend/draft-covert/draft-js-plugins
export default createPlugin({
  htmlToBlock: (nodeName, node, lastList, inBlock) => {
    if (nodeName === NODE_NAME) {
      const { src, width, height, frameBorder, allow } = node;
      return { type: BLOCK_TYPE, data: { nodeName: NODE_NAME, src, width, height, frameBorder, allow } };
    }
  },
  htmlToEntity: (nodeName, node, create) => {
    if (nodeName === NODE_NAME) {
      const { src, width, height, frameBorder, allow } = node;
      return create(ENTITY_TYPE, 'IMMUTABLE', { src, width, height, frameBorder, allow });
    }
  },
  blockToHTML: next => block => {
    const result = next(block);
    if (block.data && React.isValidElement(result)) {
      return React.cloneElement(result, {});
    }
    return result;
  },
  entityToHTML: (entity, originalText) => {
    if (entity.type === ENTITY_TYPE) {
      const { src, width, height, frameBorder, allow } = entity.data;
      return (
        `<iframe src="${src}" height="${height}" width="${width}" ` +
        `frameborder="${frameBorder}" allow="${allow}" allowfullscreen />`
      );
    }
  },
});

export const iframeBlockRendererFn = (block, editor) => {
  if (block.getType() === 'atomic' && block.size > 0 && block.getData().get('nodeName') === NODE_NAME) {
    return {
      component: ({ block, children }) => {
        const data = block.getData();
        return (
          <iframe
            title={data.get('src')}
            src={data.get('src')}
            height={data.get('height')}
            width={data.get('width')}
            frameBorder={data.get('frameBorder')}
            allow={data.get('allow')}
            allowFullScreen
          />
        );
      },
      editable: false,
    };
  }
};
