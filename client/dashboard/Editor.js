import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { compose, graphql } from 'react-apollo';
import ContentEditor from '../content/ContentEditor';
import { convertFromRaw, EditorState } from 'draft-js';
import Cookies from 'js-cookie';
import { defineMessages, F } from '../../shared/i18n';
import FormControl from '@material-ui/core/FormControl';
import { getTextForLine } from '../editor/utils/Text';
import gql from 'graphql-tag';
import HiddenSnackbarShim from '../components/HiddenSnackbarShim';
import { insertTextAtLine } from '../editor/utils/Text';
import MenuItem from '@material-ui/core/MenuItem';
import React, { PureComponent } from 'react';
import Select from '@material-ui/core/Select';
import styles from './Dashboard.module.css';
import Toolbar from '@material-ui/core/Toolbar';

const messages = defineMessages({
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
      successMessage: null,
    };
  }

  componentDidMount() {
    if (window.location.hash.startsWith('#reblog')) {
      const searchParams = new URLSearchParams(window.location.hash.slice(1));
      const url = searchParams.get('reblog');
      const img = searchParams.get('img');

      this.reblog(img || url);
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
  }

  reblog(text) {
    const contentEditor = this.editor.current.getContentEditor();
    const editorState = contentEditor.editorState;
    insertTextAtLine(editorState, 0, '\n');
    contentEditor.handlePastedText(text, undefined /* html */, editorState);
  }

  handlePost = async evt => {
    evt.preventDefault();

    const editor = this.editor.current;
    const { style, code, content } = editor.export();

    // TODO(mime): gotta be a simpler way then all this conversion.
    const title = getTextForLine(EditorState.createWithContent(convertFromRaw(content)), 0);

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

    await this.props.mutate({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        postContent: Object.assign({}, variables, { __typename: 'Content' }),
      },
    });

    editor.clear();

    this.setState({ fileInfo: null, message: messages.posted }, () => {
      this.setState({ message: null });
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
        <ContentEditor ref={this.editor} showPlaceholder={true} content={null} onMediaAdd={this.handleMediaAdd} />
        <HiddenSnackbarShim message={this.state.message} variant="success" />
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
