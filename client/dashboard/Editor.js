import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import ContentEditor from '../content/ContentEditor';
import { convertFromRaw, EditorState } from 'draft-js';
import Cookies from 'js-cookie';
import { defineMessages, F } from '../../shared/i18n';
import { EditorUtils } from 'hello-world-editor';
import FormControl from '@material-ui/core/FormControl';
import gql from 'graphql-tag';
import HiddenSnackbarShim from '../components/HiddenSnackbarShim';
import MenuItem from '@material-ui/core/MenuItem';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import Select from '@material-ui/core/Select';
import styles from './Dashboard.module.css';
import Toolbar from '@material-ui/core/Toolbar';
import { useMutation, useQuery } from '@apollo/react-hooks';

const messages = defineMessages({
  error: { msg: 'Error posting content.' },
  posted: { msg: 'Success!' },
});

const SITE_MAP_AND_USER_QUERY = gql`
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
`;

const POST_CONTENT = gql`
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
`;

export default function DashboardEditor({ username }) {
  const { data } = useQuery(SITE_MAP_AND_USER_QUERY, {
    variables: {
      username: username,
    },
  });
  const [postContent, result] = useMutation(POST_CONTENT);

  const editor = useRef(null);
  const [fileInfo, setFileInfo] = useState(null);
  // Not so clean but, meh, don't feel like implementing two separate <select>'s
  const [sectionAndAlbum, setSectionAndAlbum] = useState(
    JSON.stringify({ section: data.fetchSiteMap[0].name, album: '' })
  );
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [didSetUnsavedChanges, setDidSetUnsavedChanges] = useState(false);

  const handleKeyDown = evt => {
    // TODO(mime): combine this logic somewhere. (also in keyboard.js)
    const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
    const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
    if (isAccelKey && evt.key === 's') {
      handlePost();
    }
  };

  useEffect(() => {
    if (window.location.hash.startsWith('#reblog')) {
      const searchParams = new URLSearchParams(window.location.hash.slice(1));
      const url = searchParams.get('reblog');
      const img = searchParams.get('img');

      reblog(img || url, url);
      window.location.hash = '';
    }

    // On first load, set unsaved changes to false, the first change is just a focus selection change.
    if (!didSetUnsavedChanges) {
      setDidSetUnsavedChanges(true);

      setTimeout(() => {
        editor.current && editor.current.setUnsavedChanges(false);
      }, 0);
    }

    const sectionAndAlbum = Cookies.get('sectionAndAlbum');
    if (sectionAndAlbum) {
      setSectionAndAlbum(sectionAndAlbum);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [didSetUnsavedChanges, errorMessage, successMessage, fileInfo]);

  useEffect(() => {
    setErrorMessage(null);
  }, [errorMessage]);

  useEffect(() => {
    setSuccessMessage(null);
  }, [successMessage]);

  useImperativeHandle(editor, () => ({
    insertText: text => {
      const contentEditor = editor.current.getContentEditor();
      let editorState = contentEditor.editorState;
      editorState = EditorUtils.Text.insertTextAtLine(editorState, 1, `\n${text}\n`);
      contentEditor.onChange(editorState);
    },
  }));

  async function reblog(text, opt_url) {
    const contentEditor = editor.current.getContentEditor();
    let editorState = contentEditor.editorState;
    editorState = EditorUtils.Text.insertTextAtLine(editorState, 0, '\n');
    await contentEditor.handlePastedText(text, undefined /* html */, editorState);

    if (opt_url) {
      editorState = EditorUtils.Text.insertTextAtLine(contentEditor.editorState, 2, opt_url);
      contentEditor.onChange(editorState);
    }
  }

  const handlePost = async evt => {
    evt && evt.preventDefault();

    const editorRef = editor.current;
    const { style, code, content } = editorRef.export();

    // TODO(mime): gotta be a simpler way then all this conversion.
    const title = EditorUtils.Text.getTextForLine(EditorState.createWithContent(convertFromRaw(content)), 0);

    const name = title.replace(/[^A-Za-z0-9-]/g, '-');
    const { section, album } = JSON.parse(sectionAndAlbum);

    const thumb = fileInfo?.thumb || '';

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
      await postContent({
        variables,
        optimisticResponse: {
          __typename: 'Mutation',
          postContent: Object.assign({}, variables, { __typename: 'Content' }),
        },
      });
    } catch (ex) {
      setErrorMessage(messages.error);
      return;
    }

    editorRef.clear();

    setFileInfo(null);
    setSuccessMessage(messages.posted);
  };

  const handleSectionAndAlbumChange = evt => {
    setSectionAndAlbum(evt.target.value);
    Cookies.set('sectionAndAlbum', evt.target.value);
  };

  function generateSiteMapItem(item, albums, sectionName) {
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

  function generateSiteMap(siteMap) {
    let items = [];
    for (let i = 0; i < siteMap.length; ++i) {
      const item = siteMap[i];
      const nextItem = siteMap[i + 1];

      let albums = [];
      if (nextItem?.album === 'main') {
        for (i += 1; i < siteMap.length; ++i) {
          const albumItem = siteMap[i];
          if (albumItem.album === 'main') {
            albums.push(generateSiteMapItem(albumItem, undefined, item.name));
          } else {
            i -= 1;
            break;
          }
        }
      }

      items.push(generateSiteMapItem(item, albums));
      items = items.concat(albums);
    }

    return items;
  }

  const handleMediaAdd = fileInfos => {
    // We currently just grab the first one and disregard the other ones for purposes of getting the thumb.
    setFileInfo(fileInfos[0]);
  };

  const { section, album } = JSON.parse(sectionAndAlbum);

  return (
    <div className={styles.editor}>
      <Toolbar>
        <form autoComplete="off" className={styles.editorForm}>
          <FormControl className={styles.editorToolbar}>
            <Select
              value={sectionAndAlbum}
              onChange={handleSectionAndAlbumChange}
              inputProps={{
                name: 'sectionAndAlbum',
              }}
            >
              {generateSiteMap(data.fetchSiteMap)}
            </Select>
            <Button type="submit" onClick={handlePost} className={classNames('hw-button', 'hw-edit', styles.post)}>
              <F msg="post" />
            </Button>
          </FormControl>
        </form>
      </Toolbar>
      <ContentEditor
        ref={editor}
        showPlaceholder={true}
        mentions={data.fetchFollowing}
        content={null}
        section={section}
        album={album}
        onMediaAdd={handleMediaAdd}
      />
      <HiddenSnackbarShim message={successMessage || errorMessage} variant={successMessage ? 'success' : 'error'} />
    </div>
  );
}
