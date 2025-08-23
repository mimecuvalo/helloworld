import { Content, ContentAndUserQuery } from 'data/graphql-generated';
import Editor from '../editor/Editor';
import { useCallback, useEffect, useState } from 'react';
import { useEditor } from 'application/EditorContext';
import { Alert, Snackbar } from '@mui/material';
import { defineMessages, useIntl } from 'i18n';
import { gql, useMutation } from '@apollo/client';
import ContentQuery from './ContentQuery';

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
  const [wasEditing, setWasEditing] = useState(false);
  const { isEditing, setIsEditing } = useEditor();
  const [editorValue, setEditorValue] = useState(content.view);
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
    if (isEditing) {
      setWasEditing(true);
    }
  }, [isEditing]);

  useEffect(() => {
    const save = async () => {
      const successMsg = intl.formatMessage(messages.posted);
      const errorMsg = intl.formatMessage(messages.error);
      const title = (
        editorValue.match(/<h1>(.*?)<\/h1>/)?.[1] ||
        editorValue.split('</p>')[0].split('\n')[0].trim() ||
        content.title ||
        ''
      ).replace(/<[^>]*>?/g, '');
      const variables = {
        username: content.username,
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
          update: (store, { data: { saveContent } }) => {
            const contentVariables = { username: content.username, name: content.name };
            const query = ContentQuery;
            const data = store.readQuery<ContentAndUserQuery>({ query, variables: contentVariables });
            store.writeQuery({
              query,
              variables: contentVariables,
              data: {
                ...data,
                fetchContent: {
                  ...data?.fetchContent,
                  ...saveContent,
                },
              },
            });
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

    if (wasEditing && !isEditing) {
      setWasEditing(false);
      save();
    }
  }, [isEditing, wasEditing, editorValue, content, intl, saveContent, setIsEditing]);

  const handleEditorChange = useCallback((name: string, value: string) => {
    setEditorValue(value);
    setHasUnsavedChanges(true);
  }, []);

  const handleToastClose = () => setToastMsg('');

  return (
    <>
      {isEditing && (
        <Editor
          name="content-editor"
          section={content.section}
          album={content.album}
          defaultValue={content.view}
          onChange={handleEditorChange}
        />
      )}
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
