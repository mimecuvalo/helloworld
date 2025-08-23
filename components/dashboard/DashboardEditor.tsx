import {
  Alert,
  Button,
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Toolbar,
  styled,
  useTheme,
} from 'components';
import { F, defineMessages, useIntl } from 'i18n';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import { ArrowDropDown } from '@mui/icons-material';
import Cookies from 'js-cookie';
import Editor from 'components/editor/Editor';
import { SelectChangeEvent } from '@mui/material';
import { SiteMapAndUserEditorQuery } from 'data/graphql-generated';
import baseTheme from 'styles';
import { useEditor } from 'application/EditorContext';
import { reblog, unfurl } from './util';

const messages = defineMessages({
  posted: { defaultMessage: 'Success!' },
  error: { defaultMessage: 'Error posting content.' },
});

const DashboardEditorContainer = styled('div', { label: 'DashboardEditorContainer' })`
  position: relative;

  .tiptap {
    min-height: 33vh;
    border: 1px solid ${(props) => props.theme.palette.primary.light};
    box-shadow:
      1px 1px ${(props) => props.theme.palette.primary.light},
      2px 2px ${(props) => props.theme.palette.primary.light},
      3px 3px ${(props) => props.theme.palette.primary.light};
    padding: ${(props) => props.theme.spacing(2, 2, 2, 3.5)};
    margin-bottom: ${(props) => props.theme.spacing(3.5)};
  }
`;

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
    $view: String!
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
      view: $view
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
      view
    }
  }
`;

export default function DashboardEditor({ username }: { username: string }) {
  const { editor } = useEditor();
  const theme = useTheme();
  const intl = useIntl();
  const { loading, data } = useQuery<SiteMapAndUserEditorQuery>(SITE_MAP_AND_USER_QUERY, {
    variables: {
      username,
    },
  });

  const [postContent] = useMutation(POST_CONTENT);

  const [contentThumb, setContentThumb] = useState('');
  // Not so clean but, meh, don't feel like implementing two separate <select>'s
  const [sectionAndAlbum, setSectionAndAlbum] = useState(
    JSON.stringify({ section: data?.fetchSiteMap[0].name, album: '', hidden: false })
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isPostSuccess, setIsPostSuccess] = useState(false);
  const [editorValue, setEditorValue] = useState('');
  const successMsg = intl.formatMessage(messages.posted);
  const errorMsg = intl.formatMessage(messages.error);
  const [editorKeyToClearState, setEditorKeyToClearState] = useState(0);

  useEffect(() => {
    const handleOnBeforeUnload = (evt: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        evt.returnValue = 'You have unfinished changes!';
      }
    };
    window.addEventListener('beforeunload', handleOnBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleOnBeforeUnload);
  }, [hasUnsavedChanges]);

  const handlePost = async () => {
    const title = (
      editorValue.match(/<h1>(.*?)<\/h1>/)?.[1] ||
      editorValue.split('</p>')[0].split('\n')[0].trim() ||
      ''
    ).replace(/<[^>]*>?/g, '');
    const name = title.replace(/[^A-Za-z0-9-]/g, '-').toLowerCase();
    const { section, album, hidden } = JSON.parse(sectionAndAlbum);

    const thumb = contentThumb || '';

    const variables = {
      username,
      section,
      album,
      name,
      title,
      hidden,
      thumb,
      style: '', // TODO
      code: '', // TODO
      view: editorValue,
    };

    try {
      await postContent({
        variables,
        optimisticResponse: {
          __typename: 'Mutation',
          postContent: Object.assign({}, variables, { __typename: 'Content' }),
        },
      });
    } catch {
      setToastMsg(errorMsg);
      setIsPostSuccess(false);
      return;
    }

    setContentThumb('');
    setToastMsg(successMsg);
    setIsPostSuccess(true);
    setHasUnsavedChanges(false);
    setEditorValue('');
    setEditorKeyToClearState(editorKeyToClearState + 1);
  };

  useEffect(() => {
    const sectionAndAlbum = Cookies.get('sectionAndAlbum');
    if (sectionAndAlbum) {
      setSectionAndAlbum(sectionAndAlbum);
    }
  }, []);

  useEffect(() => {
    if (editor && window.location.hash.startsWith('#reblog')) {
      const searchParams = new URLSearchParams(window.location.hash.slice(1));
      const url = searchParams.get('reblog') || '';
      const img = searchParams.get('img') || '';

      reblog(editor, img || url, url);
      window.location.hash = '';
    }
  }, [editor]);

  const handleMediaAdd = useCallback((url: string) => {
    setContentThumb(url);
  }, []);

  const handlePaste = useCallback(
    async (text: string) => {
      const potentialLink = text.match(/^https?:\/\//) || text.match(/^<iframe /);
      if (potentialLink) {
        const unfurlInfo = await unfurl(text);

        if (!unfurlInfo.wasMediaFound) {
          return;
        }

        if (unfurlInfo.isError) {
          setToastMsg(errorMsg);
          setIsPostSuccess(false);
          return;
        }

        if (unfurlInfo.image) {
          setContentThumb(unfurlInfo.image);
        }

        unfurlInfo.result =
          `<h1>${unfurlInfo.title}</h1><br><br>` + unfurlInfo.result + `<br><br><a href="${text}">${text}</a>`;
        setEditorValue(unfurlInfo.result);
        setHasUnsavedChanges(true);
      }
    },
    [errorMsg]
  );

  const handleEditorChange = useCallback((name: string, value: string) => {
    setEditorValue(value);
    setHasUnsavedChanges(true);
  }, []);

  const handleToastClose = () => setToastMsg('');

  const handleSectionAndAlbumChange = (evt: SelectChangeEvent) => {
    setSectionAndAlbum(evt.target.value);
    Cookies.set('sectionAndAlbum', evt.target.value);
  };

  function generateSiteMapItem(
    item: SiteMapAndUserEditorQuery['fetchSiteMap'][0],
    albums: ReactNode[] | undefined,
    sectionName?: string
  ) {
    const value = {
      section: sectionName || item.name,
      album: sectionName ? item.name : '',
      hidden: item.hidden,
    };
    return (
      <MenuItem key={item.name} value={JSON.stringify(value)}>
        {!albums ? <>&nbsp;&nbsp;&nbsp;</> : null}
        {item.title}
      </MenuItem>
    );
  }

  function generateSiteMap(siteMap: SiteMapAndUserEditorQuery['fetchSiteMap']) {
    let items: ReactNode[] = [];
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

  if (loading || !data) {
    return null;
  }

  const { section, album } = JSON.parse(sectionAndAlbum);

  return (
    <DashboardEditorContainer>
      <Toolbar
        sx={{
          position: 'absolute',
          top: 0,
          right: '8px',
          justifyContent: 'flex-end',
          zIndex: baseTheme.zindex.abovePage,
        }}
        disableGutters
      >
        <FormGroup row>
          <FormControl>
            <InputLabel id="section-and-album-select-label" className="notranslate">
              section &amp; album
            </InputLabel>
            <Select
              className="notranslate"
              value={sectionAndAlbum}
              onChange={handleSectionAndAlbumChange}
              name="sectionAndAlbum"
              size="small"
              label="section & album"
              labelId="section-and-album-select-label"
              sx={{ minWidth: '150px' }}
              IconComponent={(props) => <ArrowDropDown {...props} style={{ color: theme.palette.primary.main }} />}
            >
              {generateSiteMap(data.fetchSiteMap)}
            </Select>
          </FormControl>
          <Button onClick={handlePost}>
            <F defaultMessage="post" />
          </Button>
        </FormGroup>
      </Toolbar>
      <Editor
        key={`editor-${editorKeyToClearState}`}
        name="dashboard-editor"
        section={section}
        album={album}
        defaultValue={editorValue}
        placeholder="Once upon a time, in cafe, far, far away."
        onChange={handleEditorChange}
        onMediaAdd={handleMediaAdd}
        onPaste={handlePaste}
      />
      <Snackbar open={!!toastMsg} autoHideDuration={3000} onClose={handleToastClose}>
        <Alert
          className="notranslate"
          elevation={6}
          variant="filled"
          onClose={handleToastClose}
          severity={isPostSuccess ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </DashboardEditorContainer>
  );
}
