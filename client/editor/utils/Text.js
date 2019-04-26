import { EditorState, Modifier, SelectionState } from 'draft-js';

export function getTextForLine(editorState, line) {
  return editorState
    .getCurrentContent()
    .getPlainText()
    .split('\n')[line];
}

export function insertTextAtLine(editorState, line, text) {
  const selectionState = SelectionState.createEmpty(
    editorState
      .getCurrentContent()
      .getBlockMap()
      .keySeq()
      .get(line)
  ).merge({
    anchorOffset: 0,
    focusOffset: 0,
  });

  const newContentState = Modifier.replaceText(editorState.getCurrentContent(), selectionState, text);
  editorState = EditorState.push(editorState, newContentState, 'insert-text');

  return editorState;
}
