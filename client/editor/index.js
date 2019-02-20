import './Draft.css';
import { convertFromHTML } from 'draft-convert';
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import draftJSExtendPlugins, { blockRenderers, decorator } from './plugins';
import Editor from 'draft-js-plugins-editor';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import React, { Component } from 'react';

const plugins = [createHashtagPlugin(), createImagePlugin(), createLinkifyPlugin()];

export default class HelloWorldEditor extends Component {
  constructor(props) {
    super(props);

    const content = this.props.content;

    let state;
    if (content.content) {
      state = convertFromRaw(JSON.parse(content.content));
    } else if (content.view) {
      // XXX(mime): this is the dumbest shit i have ever seen. ARGH. the custom block renderer won't fire unless
      // there's a whitespace character before the <img /> tag to attach to. ARRRRRRRRRRGH.
      // See related hack in image.js for the blockRendererFn.
      const view = content.view.replace(/<img /g, ' <img ');

      state = draftJSExtendPlugins(convertFromHTML)(view);
    }

    this.state = {
      editorState: EditorState.createWithContent(state),
    };
  }

  onChange = editorState => {
    this.setState({
      editorState,
    });
  };

  export() {
    return convertToRaw(this.state.editorState.getCurrentContent());
  }

  render() {
    return (
      <Editor
        readOnly={this.props.readOnly}
        decorators={[decorator]}
        blockRendererFn={blockRenderers}
        editorState={this.state.editorState}
        onChange={this.onChange}
        plugins={plugins}
      />
    );
  }
}
