import { getDefaultKeyBinding, KeyBindingUtil } from 'draft-js';
import { RichUtils } from 'draft-js';

const MAX_DEPTH = 5;

const { hasCommandModifier } = KeyBindingUtil;
export function keyBindingFn(evt) {
  // Accel + Alt
  const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
  const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
  if (isAccelKey && evt.altKey) {
    switch (evt.key) {
      case 's':
        return 'format-strikethrough';
      case '1':
        return 'format-header-1';
      case '2':
        return 'format-header-2';
      case '3':
        return 'format-header-3';
      case 'c':
        return 'format-code-block';
      default:
        break;
    }
  }

  // Accel + Shift
  if (isAccelKey && evt.shiftKey) {
    switch (evt.nativeEvent.code) {
      case 'Digit7':
        return 'format-numbered';
      case 'Digit8':
        return 'format-bulleted';
      default:
        break;
    }

    switch (evt.key) {
      case '>':
        return 'format-blockquote';
      default:
        break;
    }
  }

  // Accel
  if (hasCommandModifier(evt)) {
    switch (evt.key) {
      case 'b':
        return 'format-bold';
      case 'i':
        return 'format-italic';
      case 'u':
        return 'format-underline';
      case 's':
        if (evt.altKey) {
          return 'format-strikethrough';
        }
        return 'save';
      case 'k':
        return 'format-link';
      default:
        break;
    }
  }

  if (evt.key === 'Tab') {
    return evt.shiftKey ? 'format-outdent' : 'format-indent';
  }

  return getDefaultKeyBinding(evt);
}

export function handleKeyCommand(cmd, editorState) {
  switch (cmd) {
    case 'format-bold':
      return RichUtils.toggleInlineStyle(editorState, 'BOLD');
    case 'format-italic':
      return RichUtils.toggleInlineStyle(editorState, 'ITALIC');
    case 'format-underline':
      return RichUtils.toggleInlineStyle(editorState, 'UNDERLINE');
    case 'format-strikethrough':
      return RichUtils.toggleInlineStyle(editorState, 'STRIKETHROUGH');
    case 'format-header-1':
      return RichUtils.toggleBlockType(editorState, 'header-one');
    case 'format-header-2':
      return RichUtils.toggleBlockType(editorState, 'header-two');
    case 'format-header-3':
      return RichUtils.toggleBlockType(editorState, 'header-three');
    case 'format-bulleted':
      return RichUtils.toggleBlockType(editorState, 'unordered-list-item');
    case 'format-numbered':
      return RichUtils.toggleBlockType(editorState, 'ordered-list-item');
    case 'format-blockquote':
      return RichUtils.toggleBlockType(editorState, 'blockquote');
    case 'format-code-block':
      return RichUtils.toggleBlockType(editorState, 'code-block');
    case 'format-link':
      document.querySelector('#editor-toolbar-link button').click();
      return 'handled';
    case 'format-indent':
    case 'format-outdent':
      return RichUtils.onTab({ preventDefault: () => {}, shiftKey: cmd === 'format-outdent' }, editorState, MAX_DEPTH);
    default:
      return RichUtils.handleKeyCommand(editorState, cmd);
  }
}
