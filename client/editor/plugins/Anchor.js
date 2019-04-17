import { createPlugin } from 'draft-extend';
import React from 'react';

const ENTITY_TYPE = 'ANCHOR';

// TODO(mime): one day, maybe switch wholesale to draft-extend. for now, we have a weird hybrid
// of draft-extend/draft-convert/draft-js-plugins
export default createPlugin({
  htmlToEntity: (nodeName, node, create) => {
    if (nodeName === 'a') {
      const mutable = node.firstElementChild?.nodeName === 'IMG' ? 'IMMUTABLE' : 'MUTABLE';
      const { href, target } = node;
      return create(ENTITY_TYPE, mutable, { href, target });
    }
  },

  entityToHTML: (entity, originalText) => {
    if (entity.type === ENTITY_TYPE) {
      const { href, target } = entity.data;
      return `<a href="${href}" target="${target}">${originalText}</a>`;
    }

    return originalText;
  },
});

export const AnchorDecorator = props => {
  const { href, target } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={href} target={target}>
      {props.children}
    </a>
  );
};

export function anchorStrategy(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();
    return entityKey !== null && contentState.getEntity(entityKey).getType() === ENTITY_TYPE;
  }, callback);
}
