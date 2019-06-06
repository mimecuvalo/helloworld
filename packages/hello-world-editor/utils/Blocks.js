import insertAtomicBlockShim from './AtomicBlockUtilsShim';

export function createNewBlock(type, tag, editorState, entityData, attribs) {
  // TODO(mime): ostensibly, you shouldn't need this since we have the data at the block level.
  // DraftEntity's are apparently going away 'soon'.
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity(type, 'IMMUTABLE', entityData);
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

  return insertAtomicBlockShim(editorState, entityKey, ' ', { nodeName: tag, ...attribs });
}

export default {
  createNewBlock,
}