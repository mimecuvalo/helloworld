import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { compose, graphql } from 'react-apollo';
import ContentEditor from '../content/ContentEditor';
import { convertFromRaw, EditorState } from 'draft-js';
import Cookies from 'js-cookie';
import { defineMessages, F } from '../../shared/i18n';
import { EditorUtils } from 'hello-world-editor';
import FormControl from '@material-ui/core/FormControl';
import gql from 'graphql-tag';
import HiddenSnackbarShim from '../components/HiddenSnackbarShim';
import MenuItem from '@material-ui/core/MenuItem';
import React, { PureComponent } from 'react';
import Select from '@material-ui/core/Select';
import styles from './Dashboard.module.css';
import Toolbar from '@material-ui/core/Toolbar';

const messages = defineMessages({
  error: { msg: 'Error posting content.' },
  posted: { msg: 'Success!' },
});

class DashboardEditor extends PureComponent {
  constructor(props) {
    super(props);

    this.editor = React.createRef();

    this.state = {
      fileInfo: null,
      // Not so clean but, meh, don't feel like implementing two separate <select>'s
      sectionAndAlbum: JSON.stringify({ section: this.props.data.fetchSiteMap[0].name, album: '' }),
      errorMessage: null,
      successMessage: null,
    };
  }

  componentDidMount() {
    if (window.location.hash.startsWith('#reblog')) {
      const searchParams = new URLSearchParams(window.location.hash.slice(1));
      const url = searchParams.get('reblog');
      const img = searchParams.get('img');

      this.reblog(img || url, url);
      window.location.hash = '';
    }

    // On first load, set unsaved changes to false, the first change is just a focus selection change.
    setTimeout(() => {
      this.editor.current && this.editor.current.setUnsavedChanges(false);
    }, 0);

    const sectionAndAlbum = Cookies.get('sectionAndAlbum');
    if (sectionAndAlbum) {
      this.setState({ sectionAndAlbum });
    }

    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = evt => {
    // TODO(mime): combine this logic somewhere. (also in keyboard.js)
    const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
    const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
    if (isAccelKey && evt.key === 's') {
      this.handlePost();
    }
  };

  async reblog(text, opt_url) {
    const contentEditor = this.editor.current.getContentEditor();
    let editorState = contentEditor.editorState;
    editorState = EditorUtils.Text.insertTextAtLine(editorState, 0, '\n');
    await contentEditor.handlePastedText(text, undefined /* html */, editorState);

    if (opt_url) {
      editorState = EditorUtils.Text.insertTextAtLine(contentEditor.editorState, 2, opt_url);
      contentEditor.onChange(editorState);
    }
  }

  insertText(text) {
    const contentEditor = this.editor.current.getContentEditor();
    let editorState = contentEditor.editorState;
    editorState = EditorUtils.Text.insertTextAtLine(editorState, 1, `\n${text}\n`);
    contentEditor.onChange(editorState);
  }

  handlePost = async evt => {
    evt && evt.preventDefault();

    const editor = this.editor.current;
    const { style, code, content } = editor.export();

    // TODO(mime): gotta be a simpler way then all this conversion.
    const title = EditorUtils.Text.getTextForLine(EditorState.createWithContent(convertFromRaw(content)), 0);

    const username = this.props.username;
    const name = title.replace(/[^A-Za-z0-9-]/g, '-');
    const { section, album } = JSON.parse(this.state.sectionAndAlbum);

    const thumb = this.state.fileInfo?.thumb || '';

    const variables = {
      username,
      section,
      album,
      name,
      title,
      hidden: false, // TODO(mime)
      thumb,
      style,
      code,
      content: JSON.stringify(content),
    };

    try {
      await this.props.mutate({
        variables,
        optimisticResponse: {
          __typename: 'Mutation',
          postContent: Object.assign({}, variables, { __typename: 'Content' }),
        },
      });
    } catch (ex) {
      this.setState({ errorMessage: messages.error }, () => {
        this.setState({ errorMessage: null });
      });
      return;
    }

    editor.clear();

    this.setState({ fileInfo: null, successMessage: messages.posted }, () => {
      this.setState({ successMessage: null });
    });
  };

  handleSectionAndAlbumChange = evt => {
    this.setState({ [evt.target.name]: evt.target.value });
    Cookies.set('sectionAndAlbum', evt.target.value);
  };

  generateSiteMapItem(item, albums, sectionName) {
    const value = {
      section: sectionName || item.name,
      album: sectionName ? item.name : '',
    };
    return (
      <MenuItem key={item.name} value={JSON.stringify(value)}>
        {!albums ? <>&nbsp;&nbsp;&nbsp;</> : null}
        {item.title}
      </MenuItem>
    );
  }

  generateSiteMap(siteMap) {
    let items = [];
    for (let i = 0; i < siteMap.length; ++i) {
      const item = siteMap[i];
      const nextItem = siteMap[i + 1];

      let albums = [];
      if (nextItem?.album === 'main') {
        for (i += 1; i < siteMap.length; ++i) {
          const albumItem = siteMap[i];
          if (albumItem.album === 'main') {
            albums.push(this.generateSiteMapItem(albumItem, undefined, item.name));
          } else {
            i -= 1;
            break;
          }
        }
      }

      items.push(this.generateSiteMapItem(item, albums));
      items = items.concat(albums);
    }

    return items;
  }

  handleMediaAdd = fileInfos => {
    // We currently just grab the first one and disregard the other ones for purposes of getting the thumb.
    this.setState({ fileInfo: fileInfos[0] });
  };

  render() {
    const { section, album } = JSON.parse(this.state.sectionAndAlbum);

    return (
      <div className={styles.editor}>
        <Toolbar>
          <form autoComplete="off" className={styles.editorForm}>
            <FormControl className={styles.editorToolbar}>
              <Select
                value={this.state.sectionAndAlbum}
                onChange={this.handleSectionAndAlbumChange}
                inputProps={{
                  name: 'sectionAndAlbum',
                }}
              >
                {this.generateSiteMap(this.props.data.fetchSiteMap)}
              </Select>
              <Button
                type="submit"
                onClick={this.handlePost}
                className={classNames('hw-button', 'hw-edit', styles.post)}
              >
                <F msg="post" />
              </Button>
            </FormControl>
          </form>
        </Toolbar>
        <ContentEditor
          ref={this.editor}
          showPlaceholder={true}
          mentions={this.props.data.fetchFollowing}
          content={null}
          section={section}
          album={album}
          onMediaAdd={this.handleMediaAdd}
        />
        <HiddenSnackbarShim
          message={this.state.successMessage || this.state.errorMessage}
          variant={this.state.successMessage ? 'success' : 'error'}
        />
      </div>
    );
  }
}

export default compose(
  graphql(
    gql`
      query SiteMapAndUserQuery($username: String!) {
        fetchSiteMap(username: $username) {
          album
          hidden
          name
          section
          title
          username
        }

        fetchFollowing {
          name
          username
          profile_url
          avatar
          favicon
        }
      }
    `,
    {
      options: ({ username }) => ({
        variables: {
          username: username,
        },
      }),
      withRef: true,
    }
  ),
  graphql(
    gql`
      mutation postContent(
        $section: String!
        $album: String!
        $name: String!
        $title: String!
        $hidden: Boolean!
        $thumb: String!
        $style: String!
        $code: String!
        $content: String!
      ) {
        postContent(
          section: $section
          album: $album
          name: $name
          title: $title
          hidden: $hidden
          thumb: $thumb
          style: $style
          code: $code
          content: $content
        ) {
          username
          section
          album
          name
          title
          hidden
          thumb
          style
          code
          content
        }
      }
    `,
    { withRef: true }
  )
)(DashboardEditor);
