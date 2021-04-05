import { createPlugin } from 'draft-extend';

// TODO(mime): can't we just use LINK? i forget why we're using ANCHOR separately..., something with images probably :-/
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
      const { href } = entity.data;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${originalText}</a>`;
    }

    return originalText;
  },
});

export const AnchorDecorator = (props) => {
  const { href } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );
};

export function anchorStrategy(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return entityKey !== null && contentState.getEntity(entityKey).getType() === ENTITY_TYPE;
  }, callback);
}
