import { BlockMapBuilder, CharacterMetadata, ContentBlock, EditorState, genKey, Modifier } from 'draft-js';
import { List, Repeat } from 'immutable';

// See https://github.com/facebook/draft-js/issues/553
// and https://github.com/facebook/draft-js/pull/1602
// :-/
export default function insertAtomicBlockShim(editorState, entityKey, character, data) {
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();

  const afterRemoval = Modifier.removeRange(contentState, selectionState, 'backward');

  const targetSelection = afterRemoval.getSelectionAfter();
  const afterSplit = Modifier.splitBlock(afterRemoval, targetSelection);
  const insertionTarget = afterSplit.getSelectionAfter();

  const asAtomicBlock = Modifier.setBlockType(afterSplit, insertionTarget, 'atomic');

  const charData = CharacterMetadata.create({ entity: entityKey });

  let atomicBlockConfig = {
    key: genKey(),
    type: 'atomic',
    text: character,
    characterList: List(Repeat(charData, character.length)),
    data,
  };

  let atomicDividerBlockConfig = {
    key: genKey(),
    type: 'unstyled',
  };

  // if (experimentalTreeDataSupport) {
  //   atomicBlockConfig = {
  //     ...atomicBlockConfig,
  //     nextSibling: atomicDividerBlockConfig.key,
  //   };
  //   atomicDividerBlockConfig = {
  //     ...atomicDividerBlockConfig,
  //     prevSibling: atomicBlockConfig.key,
  //   };
  // }

  const fragmentArray = [new ContentBlock(atomicBlockConfig), new ContentBlock(atomicDividerBlockConfig)];

  const fragment = BlockMapBuilder.createFromArray(fragmentArray);

  const withAtomicBlock = Modifier.replaceWithFragment(asAtomicBlock, insertionTarget, fragment);

  const newContent = withAtomicBlock.merge({
    selectionBefore: selectionState,
    selectionAfter: withAtomicBlock.getSelectionAfter().set('hasFocus', true),
  });

  return EditorState.push(editorState, newContent, 'insert-fragment');
}
