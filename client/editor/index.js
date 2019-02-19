import React, { Component } from 'react';
import Editor from 'draft-js-plugins-editor';
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import { EditorState } from 'draft-js';

/*
plugins	an array of plugins
decorators	an array of custom decorators
defaultKeyBindings	bool
defaultBlockRenderMap	bool
all other props accepted by the DraftJS Editor except decorator	https://facebook.github.io/draft-js/docs/api-reference-editor.html#props
https://github.com/jpuri/draftjs-utils
dante / megadraft
*/

const hashtagPlugin = createHashtagPlugin();
const linkifyPlugin = createLinkifyPlugin();

const plugins = [hashtagPlugin, linkifyPlugin];

export default class UnicornEditor extends Component {
  state = {
    editorState: EditorState.createEmpty(),
  };

  onChange = editorState => {
    this.setState({
      editorState,
    });
  };

  render() {
    return <Editor editorState={this.state.editorState} onChange={this.onChange} plugins={plugins} />;
  }
}
