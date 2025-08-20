import { Content } from 'data/graphql-generated';
import Editor from '../editor/Editor';
import { useCallback, useEffect, useState } from 'react';
import { useEditor } from 'application/EditorContext';
import { Alert, Snackbar } from '@mui/material';
import { defineMessages, useIntl } from 'i18n';
import { gql, useMutation } from '@apollo/client';

const messages = defineMessages({
  posted: { defaultMessage: 'Success!' },
  error: { defaultMessage: 'Error saving content.' },
});

const SAVE_CONTENT = gql`
  mutation saveContent($name: String!, $title: String!, $hidden: Boolean!, $view: String!) {
    saveContent(name: $name, title: $title, hidden: $hidden, view: $view) {
      username
      title
      view
    }
  }
`;

export default function ContentEditor({ content }: { content: Content }) {
  const { isEditing, setIsEditing } = useEditor();
  const [editorValue, setEditorValue] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const intl = useIntl();
  const [saveContent] = useMutation(SAVE_CONTENT);

  useEffect(() => {
    const handleOnBeforeUnload = (evt: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        evt.returnValue = 'You have unfinished changes!';
      }
    };
    window.addEventListener('beforeunload', handleOnBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleOnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (isEditing) return;

    const save = async () => {
      const successMsg = intl.formatMessage(messages.posted);
      const errorMsg = intl.formatMessage(messages.error);
      const title = (
        editorValue.match(/<h1>(.*?)<\/h1>/)?.[1] ||
        editorValue.split('</p>')[0].split('\n')[0].trim() ||
        ''
      ).replace(/<[^>]*>?/g, '');
      const variables = {
        name: content.name,
        title,
        hidden: content.hidden,
        // thumb,
        // style: '', // TODO
        // code: '', // TODO
        view: editorValue,
      };

      try {
        await saveContent({
          variables,
          optimisticResponse: {
            __typename: 'Mutation',
            saveContent: Object.assign({}, variables, { __typename: 'Content' }),
          },
        });
      } catch {
        setToastMsg(errorMsg);
        setIsSaveSuccess(false);
        setIsEditing(true);
        return;
      }

      setToastMsg(successMsg);
      setIsSaveSuccess(true);
      setHasUnsavedChanges(false);
    };
    save();
  }, [isEditing, editorValue, content, intl, saveContent, setIsEditing]);

  const handleEditorChange = useCallback((name: string, value: string) => {
    setEditorValue(value);
    setHasUnsavedChanges(true);
  }, []);

  const handleToastClose = () => setToastMsg('');

  if (!isEditing) return null;

  return (
    <>
      <Editor
        name="content-editor"
        section={content.section}
        album={content.album}
        defaultValue={content.view}
        onChange={handleEditorChange}
      />
      <Snackbar open={!!toastMsg} autoHideDuration={6000} onClose={handleToastClose}>
        <Alert
          className="notranslate"
          variant="filled"
          onClose={handleToastClose}
          severity={isSaveSuccess ? 'success' : 'error'}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
