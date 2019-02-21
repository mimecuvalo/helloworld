import './Draft.css';
import { buildUrl } from '../../shared/util/url_factory';
import configuration from '../app/configuration';
import { convertFromHTML } from 'draft-convert';
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import draftJSExtendPlugins, { blockRenderers, decorator } from './plugins';
import Editor from 'draft-js-plugins-editor';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import insertAtomicBlockShim from './AtomicBlockUtilsShim';
import React, { Component } from 'react';

const plugins = [createHashtagPlugin(), createImagePlugin(), createLinkifyPlugin()];

export default class HelloWorldEditor extends Component {
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
      showEditor: false,
    };
  }

  componentDidMount() {
    // TODO(mime): for some reason editorKey isn't working - having problems with SSR.
    this.setState({ showEditor: true });
  }

  onChange = editorState => {
    this.setState({
      editorState,
    });
  };

  // TODO(mime): move this somewhere else.
  handleDroppedFiles = (selection, files) => {
    const body = new FormData();
    for (const file of files) {
      body.append('files', file, file.name);
    }

    fetch(buildUrl({ pathname: '/api/upload' }), {
      method: 'POST',
      body,
      headers: { 'x-csrf-token': configuration.csrf },
    }).then(this.handleUploadComplete);

    return true;
  };

  handleUploadComplete = async response => {
    const files = await response.json();

    let editorState = this.state.editorState;
    for (const fileInfo of files) {
      const href = fileInfo.original;
      const src = fileInfo.normal;
      //const thumb = fileInfo.thumb;
      const alt = '';

      // TODO(mime): ostensibly, you shouldn't need this since we have the data at the block level.
      // DraftEntity's are apparently going away 'soon'.
      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', { src, alt });
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

      editorState = insertAtomicBlockShim(editorState, entityKey, ' ', { nodeName: 'img', href, src, alt });
    }

    this.setState({ editorState });
  };

  export() {
    return convertToRaw(this.state.editorState.getCurrentContent());
  }

  render() {
    return (
      <>
        {this.state.showEditor ? (
          <Editor
            blockRendererFn={blockRenderers}
            decorators={[decorator]}
            editorKey="editor"
            editorState={this.state.editorState}
            handleDroppedFiles={this.handleDroppedFiles}
            onChange={this.onChange}
            plugins={plugins}
            readOnly={this.props.readOnly}
          />
        ) : null}
      </>
    );
  }
}
