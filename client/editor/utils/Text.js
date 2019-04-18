export function getTextForLine(editorState, line) {
  return editorState
    .getCurrentContent()
    .getPlainText()
    .split('\n')[line];
}
