import './Draft.css';
import './Editor.css';
import classNames from 'classnames';
import { convertFromHTML } from 'draft-convert';
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import { defineMessages } from '../../shared/i18n';
import draftJSExtendPlugins, {
  alignmentPlugin,
  blockDndPlugin,
  blockRenderers,
  decorator,
  dividerPlugin,
  focusPlugin,
} from './plugins';
import Editor from 'draft-js-plugins-editor';
import EditorUtils from 'draft-js-plugins-utils';
import { convertFromRaw, convertToRaw, EditorState, RichUtils } from 'draft-js';
import Emojis, { emojiPlugin } from './ui/autocomplete/Emojis';
import { handleKeyCommand, keyBindingFn } from './input/keyboard';
import HiddenSnackbarShim from '../components/HiddenSnackbarShim';
import Mentions, { mentionPlugin } from './ui/autocomplete/Mentions';
import React, { Component } from 'react';
import styles from './Editor.module.css';
import Toolbars, { inlineToolbarPlugin, linkPlugin, sideToolbarPlugin } from './ui/toolbars';
import unfurl from './media/unfurl';
import uploadFiles from './media/attachment';

const messages = defineMessages({
  errorMedia: { msg: 'Error uploading image.' },
  errorUnfurl: { msg: 'Error unfurling link.' },
});

const { AlignmentTool } = alignmentPlugin;

const MAX_DEPTH = 5;

const plugins = [
  alignmentPlugin,
  blockDndPlugin,
  createHashtagPlugin(),
  createLinkifyPlugin(),
  dividerPlugin,
  emojiPlugin,
  focusPlugin,
  inlineToolbarPlugin,
  linkPlugin,
  mentionPlugin,
  sideToolbarPlugin,
];

class HelloWorldEditor extends Component {
  constructor(props) {
    super(props);

    const content = this.props.content;

    this.editor = React.createRef();

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

    this.state = {
      editorState: state ? EditorState.createWithContent(state) : EditorState.createWithContent(emptyContentState),
      errorMessage: null,
      fileInfo: null,
      hasText: !!state,
      hasUnsavedChanges: false,
      shiftKeyPressed: false,
    };
  }

  componentDidMount() {
    if (!this.props.readOnly) {
      window.addEventListener('beforeunload', this.handleOnBeforeUnload);
    }
  }

  componentWillUnmount() {
    if (!this.props.readOnly) {
      window.removeEventListener('beforeunload', this.handleOnBeforeUnload);
    }
  }

  get editorState() {
    return this.state.editorState;
  }

  get fileInfo() {
    return this.state.fileInfo;
  }

  focus() {
    this.editor && this.editor.current.focus();
  }

  handleOnBeforeUnload = evt => {
    if (this.state.hasUnsavedChanges) {
      evt.returnValue = 'You have unfinished changes!';
    }
  };

  setUnsavedChanges(hasUnsavedChanges) {
    this.setState({ hasUnsavedChanges });
  }

  onChange = editorState => {
    const hasText = !!editorState
      .getCurrentContent()
      .getPlainText()
      .trim();

    this.setState(
      {
        editorState,
        hasText,
        hasUnsavedChanges: !this.props.dontWarnOnUnsaved,
      },
      () => {
        this.props.onChange && this.props.onChange();
      }
    );
  };

  handleDroppedFiles = async (selection, files) => {
    const { editorState, fileInfos, isError } = await uploadFiles(this.state.editorState, files);
    if (isError) {
      this.setState({ errorMessage: messages.errorMedia }, () => {
        this.setState({ errorMessage: null });
      });
      return;
    }

    this.onChange(editorState);

    this.props.onMediaAdd && this.props.onMediaAdd(fileInfos);
    this.setState({ fileInfo: fileInfos[0] });
  };

  handleKeyCommand = cmd => {
    const editorState = handleKeyCommand(cmd, this.state.editorState);

    if (!editorState) {
      return 'unhandled';
    }

    if (typeof editorState === 'object') {
      this.onChange(editorState);
    }

    return 'handled';
  };

  handleKeyDown = evt => {
    if (evt.shiftKey) {
      this.setState({ shiftKeyPressed: true });
    }
  };

  handleKeyUp = evt => {
    if (!evt.shiftKey) {
      this.setState({ shiftKeyPressed: false });
    }
  };

  handleOnTab = evt => {
    this.onChange(RichUtils.onTab(evt, this.state.editorState, MAX_DEPTH));
  };

  handlePastedText = (text, html, editorState) => {
    const potentialLink = text.match(/^https?:\/\//) || text.match(/^<iframe /);
    if (!this.state.shiftKeyPressed && potentialLink) {
      // Decorate text with url.
      if (!editorState.getSelection().isCollapsed()) {
        editorState = EditorUtils.createLinkAtSelection(editorState, text);
        this.onChange(editorState);
        return 'handled';
      }

      this.handleUnfurl(text, html, editorState);
    }
  };

  handleUnfurl = async (text, html, editorState) => {
    const editorStateAndInfo = await unfurl(text, editorState);

    if (!editorStateAndInfo.wasMediaFound) {
      return;
    }

    if (editorStateAndInfo.isError) {
      this.setState({ errorMessage: messages.errorUnfurl }, () => {
        this.setState({ errorMessage: null });
      });
      return;
    }

    this.onChange(editorStateAndInfo.editorState);

    if (editorStateAndInfo.thumb) {
      const fileInfo = { thumb: editorStateAndInfo.thumb };
      this.props.onMediaAdd && this.props.onMediaAdd([fileInfo]);
      this.setState({ fileInfo });
    }
  };

  export() {
    return convertToRaw(this.state.editorState.getCurrentContent());
  }

  clear() {
    this.onChange(EditorState.createEmpty());
    this.setState({ hasUnsavedChanges: false });
  }

  render() {
    return (
      <>
        <div
          className={classNames('e-content', {
            [styles.showPlaceholder]: this.props.showPlaceholder && !this.state.hasText,
            [styles.commentType]: this.props.type === 'comment',
          })}
          onKeyDown={this.handleKeyDown}
          onKeyUp={this.handleKeyUp}
        >
          <Editor
            blockRendererFn={blockRenderers}
            decorators={[decorator]}
            editorKey={this.props.editorKey || 'editor'}
            editorState={this.state.editorState}
            handleDroppedFiles={this.handleDroppedFiles}
            handleKeyCommand={this.handleKeyCommand}
            handlePastedText={this.handlePastedText}
            keyBindingFn={keyBindingFn}
            onChange={this.onChange}
            onTab={this.handleOnTab}
            plugins={plugins}
            readOnly={this.props.readOnly}
            ref={this.editor}
          />
          <Toolbars AlignmentTool={AlignmentTool} dividerPlugin={dividerPlugin} />
          <Emojis />
          <Mentions mentions={this.props.mentions} />
        </div>
        <HiddenSnackbarShim message={this.state.errorMessage} variant="error" />
      </>
    );
  }
}

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

export default HelloWorldEditor;
