import './Draft.css';
import './Editor.css';
import classNames from 'classnames';
import { convertFromHTML } from 'draft-convert';
import { createUseStyles } from 'react-jss';
import { defineMessages } from 'react-intl';
import draftJSExtendPlugins, {
  alignmentPlugin,
  blockDndPlugin,
  blockRenderers,
  decorator,
  dividerPlugin,
  focusPlugin,
  hashtagPlugin,
  linkifyPlugin,
  replyPlugin,
  rsvpPlugin,
} from './plugins';
import Editor from 'draft-js-plugins-editor';
import EditorUtils from 'draft-js-plugins-utils';
import { convertFromRaw, convertToRaw, EditorState } from 'draft-js';
import Emojis, { emojiPlugin } from './ui/autocomplete/Emojis';
import { handleKeyCommand, keyBindingFn } from './input/keyboard';
import HiddenSnackbarShim from './ui/HiddenSnackbarShim';
import { IntlProvider } from 'react-intl';
import Mentions, { mentionPlugin } from './ui/autocomplete/Mentions';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { SnackbarProvider } from 'notistack';
import Toolbars, { inlineToolbarPlugin, linkPlugin, sideToolbarPlugin } from './ui/toolbars';
import unfurl from './media/unfurl';
import uploadFiles from './media/attachment';

const useStyles = createUseStyles({
  showPlaceholder: {
    '& [data-contents=true] > [data-block=true]:first-child:before': {
      display: 'block'
    },
  },
  commentType: {
    'div&': {
      marginBottom: '4px'
    },
    'div& [data-contents=true] > [data-block=true]:first-child': {
      fontSize: 'unset',
      lineHeight: 'unset'
    },
    /* TODO(mime): too delicate of a rule. */
    'ul div& > div > div': {
      padding: '0'
    }
  },
});

const messages = defineMessages({
  errorMedia: {
    id: 'hw-editor-error-media',
    defaultMessage: 'Error uploading image.',
  },
  errorUnfurl: {
    id: 'hw-editor-error-unfurl',
    defaultMessage: 'Error unfurling link.',
  },
});

const { AlignmentTool } = alignmentPlugin;

const plugins = [
  alignmentPlugin,
  blockDndPlugin,
  dividerPlugin,
  emojiPlugin,
  focusPlugin,
  hashtagPlugin,
  inlineToolbarPlugin,
  linkPlugin,
  mentionPlugin,
  replyPlugin,
  rsvpPlugin,
  sideToolbarPlugin,
  linkifyPlugin,
];

const readOnlyPlugins = [
  dividerPlugin,
  emojiPlugin,
  hashtagPlugin,
  linkPlugin,
  mentionPlugin,
  replyPlugin,
  rsvpPlugin,
  linkifyPlugin,
];

export default React.forwardRef((props, ref) => {
  const { content, dontWarnOnUnsaved, editorKey, locale, mentions, onChange: propOnChange, onLinkUnfurl, onMediaAdd, onMediaUpload, readOnly, showPlaceholder, type } = props;
  const editor = useRef(null);
  const [editorState, setEditorState] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [hasText, setHasText] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false);
  const styles = useStyles();

  useEffect(() => {
    let state;
    if (content?.content) {
      state = convertFromRaw(typeof content.content === 'string' ? JSON.parse(content.content) : content.content);
    } else if (content?.view) {
      // XXX(mime): this is the dumbest shit i have ever seen. ARGH. the custom block renderer won't fire unless
      // there's a whitespace character before the <img /> tag to attach to. ARRRRRRRRRRGH.
      // See related hack in image.js for the blockRendererFn.
      const view = content.view.replace(/<img /g, ' <img ');

      state = draftJSExtendPlugins(convertFromHTML)(view);
    }
    setEditorState(state ? EditorState.createWithContent(state) : EditorState.createWithContent(emptyContentState));
    setHasText(!!state);
    // XXX(mime): using [] is probably not the right fix but I just want this to run onload and it has a tied
    // entanglement with the propOnChange call below. Need to come up with a better solution.
  }, []);

  useEffect(() => {
    if (!readOnly) {
      window.addEventListener('beforeunload', handleOnBeforeUnload);
    }

    return () => {
      if (!readOnly) {
        window.removeEventListener('beforeunload', handleOnBeforeUnload);
      }
    };
  });

  useEffect(() => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  }, [errorMessage]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      onChange(EditorState.createEmpty());
      setHasUnsavedChanges(false);
    },
    editorState: () => editorState,
    export: () => editorState && convertToRaw(editorState.getCurrentContent()),
    fileInfo: () => fileInfo,
    focus: () => editor.current && editor.current.focus(),
    setUnsavedChanges: (hasUnsavedChanges) => setHasUnsavedChanges(hasUnsavedChanges)
  }));

  if (!editorState) {
    return null;
  }

  const handleOnBeforeUnload = evt => {
    if (hasUnsavedChanges) {
      evt.returnValue = 'You have unfinished changes!';
    }
  };

  const onChange = newEditorState => {
    const hasText = !!newEditorState
      .getCurrentContent()
      .getPlainText()
      .trim();

    setEditorState(newEditorState);
    setHasText(hasText);
    setHasUnsavedChanges(!dontWarnOnUnsaved);

    // XXX(mime): tied with hack above setEditorState change above. This should be happening *after*
    // the state changes is completed, not before...
    propOnChange && propOnChange();
  };

  const handleDroppedFiles = async (selection, files) => {
    const result = await uploadFiles(onMediaUpload, editorState, files);
    if (result.isError) {
      setErrorMessage(messages.errorMedia);
      return;
    }

    onChange(result.editorState);

    onMediaAdd && onMediaAdd(result.fileInfos);
    setFileInfo(result.fileInfos[0]);
  };

  const customHandleKeyCommand = cmd => {
    const newEditorState = handleKeyCommand(cmd, editorState);

    if (!newEditorState) {
      return 'unhandled';
    }

    if (typeof newEditorState === 'object') {
      onChange(newEditorState);
    }

    return 'handled';
  };

  const handleKeyDown = evt => {
    if (evt.shiftKey) {
      setShiftKeyPressed(true);
    }
  };

  const handleKeyUp = evt => {
    if (!evt.shiftKey) {
      setShiftKeyPressed(false);
    }
  };

  const handlePastedText = async (text, html, newEditorState) => {
    const potentialLink = text.match(/^https?:\/\//) || text.match(/^<iframe /);
    if (!shiftKeyPressed && potentialLink) {
      // Decorate text with url.
      if (!newEditorState.getSelection().isCollapsed()) {
        newEditorState = EditorUtils.createLinkAtSelection(newEditorState, text);
        onChange(newEditorState);
        return 'handled';
      }

      await handleUnfurl(text, html, newEditorState);
    }
  };

  const handleUnfurl = async (text, html, newEditorState) => {
    if (!onLinkUnfurl) {
      console.error(`Editor doesn't have onLinkUnfurl set to provide rich embeds.`);
      return;
    }

    const editorStateAndInfo = await unfurl(onLinkUnfurl, text, newEditorState);

    if (!editorStateAndInfo.wasMediaFound) {
      return;
    }

    if (editorStateAndInfo.isError) {
      setErrorMessage(messages.errorUnfurl);
      return;
    }

    onChange(editorStateAndInfo.editorState);

    if (editorStateAndInfo.thumb) {
      const fileInfo = { thumb: editorStateAndInfo.thumb };
      onMediaAdd && onMediaAdd([fileInfo]);
      setFileInfo(fileInfo);
    }
  };

  return (
    <IntlProvider locale={locale}>
      <SnackbarProvider>
        <div
          className={classNames('e-content', {
            [styles.showPlaceholder]: showPlaceholder && !hasText,
            [styles.commentType]: type === 'comment',
          })}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
        >
          <Editor
            blockRendererFn={blockRenderers}
            decorators={[decorator]}
            editorKey={editorKey || 'editor'}
            editorState={editorState}
            handleDroppedFiles={handleDroppedFiles}
            handleKeyCommand={customHandleKeyCommand}
            handlePastedText={handlePastedText}
            keyBindingFn={keyBindingFn}
            onChange={onChange}
            plugins={readOnly ? readOnlyPlugins : plugins}
            readOnly={readOnly}
            ref={editor}
          />
          {readOnly ? null : <Toolbars AlignmentTool={AlignmentTool} dividerPlugin={dividerPlugin} onMediaUpload={onMediaUpload} />}
          {readOnly ? null : <Emojis />}
          {readOnly ? null : <Mentions mentions={mentions} />}
        </div>
        {errorMessage ? <HiddenSnackbarShim message={errorMessage} variant="error" /> : null}
      </SnackbarProvider>
    </IntlProvider>
  );
});

// This keeps things stable when we render empty content for SSR.
const emptyContentState = convertFromRaw({
  entityMap: {},
  blocks: [
    {
      text: '',
      key: 'foo',
      type: 'unstyled',
      entityRanges: [],
    },
  ],
});