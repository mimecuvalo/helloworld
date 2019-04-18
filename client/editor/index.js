import './Draft.css';
import './Editor.css';
import classNames from 'classnames';
import { convertFromHTML } from 'draft-convert';
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import { defineMessages, injectIntl } from '../../shared/i18n';
import draftJSExtendPlugins, {
  alignmentPlugin,
  blockDndPlugin,
  blockRenderers,
  decorator,
  dividerPlugin,
  focusPlugin,
} from './plugins';
import Editor from 'draft-js-plugins-editor';
import { convertFromRaw, convertToRaw, EditorState, RichUtils } from 'draft-js';
import Emojis, { emojiPlugin } from './ui/autocomplete/Emojis';
import { handleKeyCommand, keyBindingFn } from './input/keyboard';
import Mentions, { mentionPlugin } from './ui/autocomplete/Mentions';
import React, { Component } from 'react';
import styles from './Editor.module.css';
import Toolbars, { inlineToolbarPlugin, linkPlugin, sideToolbarPlugin } from './ui/toolbars';
import unfurl from './media/unfurl';
import uploadFiles from './media/attachment';
import { withSnackbar } from 'notistack';

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

@withSnackbar
@injectIntl
class HelloWorldEditor extends Component {
  constructor(props) {
    super(props);

    const content = this.props.content;

    let state;
    if (content?.content) {
      state = convertFromRaw(JSON.parse(content.content));
    } else if (content?.view) {
      // XXX(mime): this is the dumbest shit i have ever seen. ARGH. the custom block renderer won't fire unless
      // there's a whitespace character before the <img /> tag to attach to. ARRRRRRRRRRGH.
      // See related hack in image.js for the blockRendererFn.
      const view = content.view.replace(/<img /g, ' <img ');

      state = draftJSExtendPlugins(convertFromHTML)(view);
    }

    this.state = {
      editorState: state ? EditorState.createWithContent(state) : EditorState.createEmpty(),
      hasText: !!state,
      hasUnsavedChanges: false,
      showEditor: false,
    };
  }

  componentDidMount() {
    // TODO(mime): for some reason editorKey isn't working - having problems with SSR.
    this.setState({ showEditor: true });

    window.addEventListener('beforeunload', this.handleOnBeforeUnload);
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

    this.setState({
      editorState,
      hasText,
      hasUnsavedChanges: true,
    });
  };

  handleDroppedFiles = async (selection, files) => {
    const { editorState, isError } = await uploadFiles(this.state.editorState, files);
    if (isError) {
      this.props.enqueueSnackbar(this.props.intl.formatMessage(messages.errorMedia), { variant: 'error' });
      return;
    }

    this.setState({ editorState });
  };

  handleKeyCommand = cmd => {
    const editorState = handleKeyCommand(cmd, this.state.editorState);

    if (!editorState) {
      return 'unhandled';
    }

    if (typeof editorState === 'object') {
      this.setState({ editorState });
    }

    return 'handled';
  };

  handleOnTab = evt => {
    this.setState({ editorState: RichUtils.onTab(evt, this.state.editorState, MAX_DEPTH) });
  };

  handlePastedText = async (text, html, editorState) => {
    if (text.match(/^https?:\/\//)) {
      const editorStateAndInfo = await unfurl(text, editorState);

      if (editorStateAndInfo.isError) {
        this.props.enqueueSnackbar(this.props.intl.formatMessage(messages.errorUnfurl), { variant: 'error' });
        return;
      }

      this.setState({ editorState: editorStateAndInfo.editorState });
    }
  };

  export() {
    return convertToRaw(this.state.editorState.getCurrentContent());
  }

  render() {
    return (
      <>
        {this.state.showEditor ? (
          <div className={classNames({ [styles.showPlaceholder]: this.props.showPlaceholder && !this.state.hasText })}>
            <Editor
              blockRendererFn={blockRenderers}
              decorators={[decorator]}
              editorKey="editor"
              editorState={this.state.editorState}
              handleDroppedFiles={this.handleDroppedFiles}
              handleKeyCommand={this.handleKeyCommand}
              handlePastedText={this.handlePastedText}
              keyBindingFn={keyBindingFn}
              onChange={this.onChange}
              onTab={this.handleOnTab}
              plugins={plugins}
              readOnly={this.props.readOnly}
            />
            <Toolbars AlignmentTool={AlignmentTool} dividerPlugin={dividerPlugin} />
            <Emojis />
            <Mentions />
          </div>
        ) : null}
      </>
    );
  }
}

export default HelloWorldEditor;
