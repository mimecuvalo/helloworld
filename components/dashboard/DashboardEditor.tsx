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
import { useEffect, useState } from 'react';

import { ArrowDropDown } from '@mui/icons-material';
import Cookies from 'js-cookie';
import Editor from 'components/Editor';
import { SelectChangeEvent } from '@mui/material';
import { SiteMapAndUserEditorQuery } from 'data/graphql-generated';
import baseTheme from 'styles';
import mime from 'mime/lite';

const IFRAME_ALLOW = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';

const messages = defineMessages({
  posted: { defaultMessage: 'Success!' },
  error: { defaultMessage: 'Error posting content.' },
});

const DashboardEditorContainer = styled('div', { label: 'DashboardEditorContainer' })`
  position: relative;
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

export default function DashboardEditor({ username }: { username: string }) {
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
    JSON.stringify({ section: data?.fetchSiteMap[0].name, album: '' })
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
    const title = editorValue.split('\n')[0].replace(/^# /, '');
    const name = title.replace(/[^A-Za-z0-9-]/g, '-').toLowerCase();
    const { section, album } = JSON.parse(sectionAndAlbum);

    const thumb = contentThumb || '';

    const variables = {
      username,
      section,
      album,
      name,
      title,
      hidden: false, // TODO(mime)
      thumb,
      style: '', // TODO
      code: '', // TODO
      content: editorValue,
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

  // useEffect(() => {
  //   if (window.location.hash.startsWith('#reblog')) {
  //     const searchParams = new URLSearchParams(window.location.hash.slice(1));
  //     const url = searchParams.get('reblog');
  //     const img = searchParams.get('img');

  //     reblog(img || url, url);
  //     window.location.hash = '';
  //   }
  // }, []);

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

  if (loading || !data) {
    return null;
  }

  const handleMediaAdd = (url: string) => {
    setContentThumb(url);
  };

  const handlePaste = async (text: string) => {
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

      if (unfurlInfo.thumb) {
        setContentThumb(unfurlInfo.thumb);
      }

      if (!editorValue) {
        unfurlInfo.result = `# ${unfurlInfo.title}\n\n` + unfurlInfo.result;
      }
      setEditorValue(unfurlInfo.result);
      setHasUnsavedChanges(true);
      setEditorKeyToClearState(editorKeyToClearState + 1);
    }
  };

  const handleEditorChange = (name: string, value: string) => {
    setEditorValue(value);
    setHasUnsavedChanges(true);
  };

  const handleEditorBlur = () => {
    /* do nothing */
  };

  const handleToastClose = () => setToastMsg('');

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
        defaultValue={editorValue || `# Give me a name\n\nNow write something brilliant.`}
        onChange={handleEditorChange}
        onBlur={handleEditorBlur}
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

export async function unfurl(url: string) {
  if (url.match(/^<iframe /)) {
    const iframe = {
      src: url.match(/src=['"]([^'"]+)['"]/)?.[1],
      width: url.match(/width=['"]([^'"]+)['"]/)?.[1] || 400,
      height: url.match(/height=['"]([^'"]+)['"]/)?.[1] || 300,
      frameBorder: 0,
      allow: url.match(/allow=['"]([^'"]+)['"]/)?.[1] || IFRAME_ALLOW,
    };

    return {
      result: `<iframe ${Object.entries(iframe)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')}></iframe>`,
      isError: false,
      wasMediaFound: true,
      isImg: false,
      thumb: '',
      title: '',
    };
  }

  if (mime.getType(url)?.match(/^image\//)) {
    const src = url;
    const href = url;
    const alt = '';

    return {
      result: `[![${alt}](${src} "${alt}")](${href})`,
      isError: false,
      wasMediaFound: true,
      isImg: true,
      thumb: url,
      title: '',
    };
  }

  let response;
  try {
    response = await fetch('/api/unfurl', {
      method: 'POST',
      body: JSON.stringify({
        url,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (ex) {
    return { result: '', isError: true, wasMediaFound: false, isImg: false, thumb: '', title: '' };
  }

  const json: any = await response.json();
  let thumb = '';
  let isImg = false;
  let result = '';
  let title = '';
  if (json.wasMediaFound) {
    if (json.iframe) {
      result = `<iframe ${Object.entries(json.iframe)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')}></iframe>`;
      thumb = json.image;
    } else {
      const href = url;
      const src = json.image;
      const alt = json.title;
      isImg = true;
      result = `[![${alt}](${src} "${alt}")]${href})`;
      thumb = json.image;
    }
    title = json.title;
  }

  return { result, isError: false, wasMediaFound: json.wasMediaFound, isImg, thumb, title };
}
