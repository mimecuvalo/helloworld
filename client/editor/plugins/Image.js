import { createPlugin } from 'draft-extend';
import React from 'react';

const BLOCK_TYPE = 'atomic';
const ENTITY_TYPE = 'IMAGE';
const NODE_NAME = 'img';

// TODO(mime): one day, maybe switch wholesale to draft-extend. for now, we have a weird hybrid
// of draft-extend/draft-covert/draft-js-plugins
export default createPlugin({
  htmlToBlock: (nodeName, node, lastList, inBlock) => {
    if (nodeName === 'figure' || (nodeName === NODE_NAME && inBlock !== BLOCK_TYPE)) {
      const anchorTag = node.firstElementChild?.nodeName === 'A' && node.firstElementChild;
      const { href } = anchorTag || {};
      const img =
        nodeName === NODE_NAME ? node : anchorTag ? node.firstElementChild.firstElementChild : node.firstElementChild;
      const { alt, src } = img || {};
      return { type: BLOCK_TYPE, data: { nodeName: NODE_NAME, href, src, alt } };
    }
  },
  htmlToEntity: (nodeName, node, create) => {
    if (nodeName === NODE_NAME) {
      const { src, alt } = node;
      return create(ENTITY_TYPE, 'IMMUTABLE', { src, alt });
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
      const { src, alt } = entity.data;
      return `<img src="${src}" alt="${alt}" />`;
    }
  },
});

export const imageBlockRendererFn = (block, editor) => {
  if (block.getType() === 'atomic' && block.size > 0 && block.getData().get('nodeName') === NODE_NAME) {
    return {
      component: ({ block, children }) => {
        const data = block.getData();
        return (
          <a href={data.get('href')}>
            <img src={data.get('src')} alt={data.get('alt')} />
          </a>
        );
      },
      editable: false,
    };
  }
};
