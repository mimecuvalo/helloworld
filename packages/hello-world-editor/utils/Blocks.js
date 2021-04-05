import insertAtomicBlockShim from './AtomicBlockUtilsShim';
import { renderToString } from 'react-dom/server';

export function createNewBlock(type, tag, editorState, entityData, attribs) {
  // TODO(mime): ostensibly, you shouldn't need this since we have the data at the block level.
  // DraftEntity's are apparently going away 'soon'.
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity(type, 'IMMUTABLE', entityData);
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

  return insertAtomicBlockShim(editorState, entityKey, ' ', { nodeName: tag, ...attribs });
}

export function decoratedBlocksToHTML(strategy, Component) {
  return (block) => {
    let indices = [];

    // XXX(mime): Backwards compatibility with draft-js-plugins, e.g. linkifyPlugin
    // Ugh, what a frankenstein mess.
    block = Object.assign({}, block, { get: (key) => block[key] });

    strategy(block, (index, lastIndex) => {
      indices.push({ index, lastIndex });
    });

    if (indices.length) {
      let html = '<p>';
      let index = 0;
      for (const indexSet of indices) {
        html += block.text.slice(index, indexSet.index);
        const decoratedText = block.text.slice(indexSet.index, indexSet.lastIndex);
        html += renderToString(<Component decoratedText={decoratedText}>{decoratedText}</Component>);
        index = indexSet.lastIndex;
      }
      html += block.text.slice(index) + '</p>';
      return html;
    }
  };
}

export default {
  createNewBlock,
};
