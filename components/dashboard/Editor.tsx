import { Button, FormControl, MenuItem, Select, Toolbar } from 'components';
import { gql, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import { F } from 'i18n';
import { SelectChangeEvent } from '@mui/material';
import { SiteMapAndUserEditorQuery } from 'data/graphql-generated';

// const messages = defineMessages({
//   error: { defaultMessage: 'Error posting content.' },
//   posted: { defaultMessage: 'Success!' },
// });

const SITE_MAP_AND_USER_QUERY = gql`
  query SiteMapAndUserEditor($username: String!) {
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
      profileUrl
      avatar
      favicon
    }
  }
`;

// const POST_CONTENT = gql`
//   mutation postContent(
//     $section: String!
//     $album: String!
//     $name: String!
//     $title: String!
//     $hidden: Boolean!
//     $thumb: String!
//     $style: String!
//     $code: String!
//     $content: String!
//   ) {
//     postContent(
//       section: $section
//       album: $album
//       name: $name
//       title: $title
//       hidden: $hidden
//       thumb: $thumb
//       style: $style
//       code: $code
//       content: $content
//     ) {
//       username
//       section
//       album
//       name
//       title
//       hidden
//       thumb
//       style
//       code
//       content
//     }
//   }
// `;

export default function Editor({ username }: { username: string }) {
  const { loading, data } = useQuery<SiteMapAndUserEditorQuery>(SITE_MAP_AND_USER_QUERY, {
    variables: {
      username,
    },
  });

  // const [postContent] = useMutation(POST_CONTENT);

  // const editor = useRef(null);
  // const [fileInfo, setFileInfo] = useState(null);
  // Not so clean but, meh, don't feel like implementing two separate <select>'s
  const [sectionAndAlbum, setSectionAndAlbum] = useState(
    JSON.stringify({ section: data?.fetchSiteMap[0].name, album: '' })
  );
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  // const [didSetUnsavedChanges, setDidSetUnsavedChanges] = useState(false);

  // const handlePost = useCallback(
  //   async (evt) => {
  //     evt && evt.preventDefault();

  //     const editorRef = editor.current;
  //     const { style, code, content } = editorRef.export();

  //     // TODO(mime): gotta be a simpler way then all this conversion.
  //     const title = EditorUtils.Text.getTextForLine(EditorState.createWithContent(convertFromRaw(content)), 0);

  //     const name = title.replace(/[^A-Za-z0-9-]/g, '-');
  //     const { section, album } = JSON.parse(sectionAndAlbum);

  //     const thumb = fileInfo?.thumb || '';

  //     const variables = {
  //       username,
  //       section,
  //       album,
  //       name,
  //       title,
  //       hidden: false, // TODO(mime)
  //       thumb,
  //       style,
  //       code,
  //       content: JSON.stringify(content),
  //     };

  //     try {
  //       await postContent({
  //         variables,
  //         optimisticResponse: {
  //           __typename: 'Mutation',
  //           postContent: Object.assign({}, variables, { __typename: 'Content' }),
  //         },
  //       });
  //     } catch (ex) {
  //       setErrorMessage(messages.error);
  //       return;
  //     }

  //     editorRef.clear();

  //     setFileInfo(null);
  //     setSuccessMessage(messages.posted);
  //     editor.current && editor.current.setUnsavedChanges(false);
  //   },
  //   [fileInfo, postContent, sectionAndAlbum, username]
  // );

  // const handleKeyDown = useCallback(
  //   (evt) => {
  //     // TODO(mime): combine this logic somewhere. (also in keyboard.js)
  //     const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
  //     const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
  //     if (isAccelKey && evt.key === 's') {
  //       handlePost();
  //     }
  //   },
  //   [handlePost]
  // );

  // useEffect(() => {
  //   if (window.location.hash.startsWith('#reblog')) {
  //     const searchParams = new URLSearchParams(window.location.hash.slice(1));
  //     const url = searchParams.get('reblog');
  //     const img = searchParams.get('img');

  //     reblog(img || url, url);
  //     window.location.hash = '';
  //   }

  //   // On first load, set unsaved changes to false, the first change is just a focus selection change.
  //   if (!didSetUnsavedChanges) {
  //     setDidSetUnsavedChanges(true);

  //     setTimeout(() => {
  //       editor.current && editor.current.setUnsavedChanges(false);
  //     }, 0);
  //   }

  //   const sectionAndAlbum = Cookies.get('sectionAndAlbum');
  //   if (sectionAndAlbum) {
  //     setSectionAndAlbum(sectionAndAlbum);
  //   }

  //   document.addEventListener('keydown', handleKeyDown);
  //   return () => document.removeEventListener('keydown', handleKeyDown);
  // }, [didSetUnsavedChanges, handleKeyDown]);

  useEffect(() => {
    setErrorMessage(null);
  }, [errorMessage]);

  useEffect(() => {
    setSuccessMessage(null);
  }, [successMessage]);

  // useImperativeHandle(ref, () => ({
  //   insertText: (text) => {
  //     const contentEditor = editor.current.getContentEditor();
  //     let editorState = contentEditor.editorState;
  //     editorState = EditorUtils.Text.insertTextAtLine(editorState, 1, `\n${text}\n`);
  //     contentEditor.onChange(editorState);
  //   },
  // }));

  if (loading || !data) {
    return null;
  }

  // async function reblog(text, opt_url) {
  //   const contentEditor = editor.current.getContentEditor();
  //   let editorState = contentEditor.editorState;
  //   editorState = EditorUtils.Text.insertTextAtLine(editorState, 0, '\n');
  //   await contentEditor.handlePastedText(text, undefined /* html */, editorState);

  //   if (opt_url) {
  //     editorState = EditorUtils.Text.insertTextAtLine(contentEditor.editorState, 2, opt_url);
  //     contentEditor.onChange(editorState);
  //   }
  // }

  const handleSectionAndAlbumChange = (evt: SelectChangeEvent) => {
    setSectionAndAlbum(evt.target.value);
    Cookies.set('sectionAndAlbum', evt.target.value);
  };

  function generateSiteMapItem(
    item: SiteMapAndUserEditorQuery['fetchSiteMap'][0],
    albums: JSX.Element[] | undefined,
    sectionName?: string
  ) {
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

  function generateSiteMap(siteMap: SiteMapAndUserEditorQuery['fetchSiteMap']) {
    let items: JSX.Element[] = [];
    for (let i = 0; i < siteMap.length; ++i) {
      const item = siteMap[i];
      const nextItem = siteMap[i + 1];

      const albums = [];
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

  // const handleMediaAdd = (fileInfos) => {
  //   // We currently just grab the first one and disregard the other ones for purposes of getting the thumb.
  //   setFileInfo(fileInfos[0]);
  // };

  //const { section, album } = JSON.parse(sectionAndAlbum);

  return (
    <div>
      <Toolbar>
        <form autoComplete="off">
          <FormControl>
            <Select
              className="notranslate"
              value={sectionAndAlbum}
              onChange={handleSectionAndAlbumChange}
              inputProps={{
                name: 'sectionAndAlbum',
              }}
            >
              {generateSiteMap(data.fetchSiteMap)}
            </Select>
            <Button type="submit">
              <F defaultMessage="post" />
            </Button>
          </FormControl>
        </form>
      </Toolbar>
      Editor
    </div>
  );
}
