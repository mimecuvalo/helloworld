import { styled } from '@mui/material/styles';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import { Alert, Button, Snackbar } from 'components';
import { useEffect, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { Content, ContentAndUserQuery } from '@/data/graphql-generated';
import { useIntl, F, defineMessages } from 'i18n';
import ContentQuery from './ContentQuery';
import EditorToolbar from '../editor/Toolbar';

const messages = defineMessages({
  error: { defaultMessage: 'Error updating content.' },
});

const EditorStyling = styled('div', { label: 'EditorStyling' })`
  width: 100%;
  font-family: ${(props) => props.theme.typography.fontFamily};

  .tiptap {
    width: 100%;
    min-height: 10vh;
    border: 1px solid ${(props) => props.theme.palette.primary.light};
    box-shadow:
      1px 1px ${(props) => props.theme.palette.primary.light},
      2px 2px ${(props) => props.theme.palette.primary.light},
      3px 3px ${(props) => props.theme.palette.primary.light};
    padding: ${(props) => props.theme.spacing(2, 2, 2, 3.5)};
    margin-bottom: ${(props) => props.theme.spacing(1.5)};
    background-color: ${(props) => props.theme.palette.background.default};
    color: ${(props) => props.theme.palette.text.primary};
    outline: none;

    &:focus {
      outline: none;
    }
  }
`;

const POST_COMMENT = gql`
  mutation postComment($username: String!, $name: String!, $content: String!) {
    postComment(username: $username, name: $name, content: $content) {
      avatar
      content
      deleted
      favorited
      fromUsername
      link
      localContentName
      postId
      toUsername
      type
      username
      content
    }
  }
`;

export default function CommentsEditor({ content }: { content: Content }) {
  const intl = useIntl();
  const [isPosting, setIsPosting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [postComment] = useMutation(POST_COMMENT);
  const [commentContent, setCommentContent] = useState('');
  const [editorKeyToClearState, setEditorKeyToClearState] = useState(0);

  const handleKeyDown = (evt: KeyboardEvent) => {
    // TODO(mime): combine this logic somewhere. (also in keyboard.js)
    const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
    const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
    if (isAccelKey && evt.key === 'Enter') {
      handlePost();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const handlePost = async () => {
    const { username, name } = content;
    const variables = { username, name, content: commentContent };

    setIsPosting(true);

    try {
      await postComment({
        variables,
        update: (store, { data: { postComment } }) => {
          const contentVariables = { username, name };
          const query = ContentQuery;
          const data = store.readQuery<ContentAndUserQuery>({ query, variables: contentVariables });
          data?.fetchCommentsRemote.unshift(postComment);
          store.writeQuery({ query, variables: contentVariables, data });
        },
      });
      setEditorKeyToClearState(editorKeyToClearState + 1);
    } catch {
      setToastMsg(intl.formatMessage(messages.error));
    }

    setIsPosting(false);
  };

  const handleToastClose = () => setToastMsg('');

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: false,
          horizontalRule: false,
          link: false,
        }),
        Placeholder.configure({
          placeholder: 'Hello, world.',
        }),
      ],
      content: '',
      onUpdate: ({ editor }: { editor: Editor }) => {
        setCommentContent(editor.getHTML());
      },
      immediatelyRender: false,
    },
    [editorKeyToClearState]
  );

  return (
    <>
      <EditorStyling>
        <EditorToolbar editor={editor} disableHeadings />
        <EditorContent editor={editor} className="notranslate" />
      </EditorStyling>
      <Button variant="contained" disabled={isPosting} onClick={handlePost} sx={{ float: 'right' }}>
        <F defaultMessage="post" />
      </Button>

      <Snackbar open={!!toastMsg} autoHideDuration={6000} onClose={handleToastClose}>
        <Alert onClose={handleToastClose} severity="error" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
