import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import { useEditor } from 'lib/editor-context';
import Editor from '../editor/Editor';
import editorStyles from '../editor/editor.module.css';

type EditableContent = {
  username: string;
  name: string;
  section: string;
  album: string;
  title: string;
  hidden: boolean;
  view: string;
};

const messages = defineMessages({
  posted: { defaultMessage: 'Success!' },
  error: { defaultMessage: 'Error saving content.' },
});

export default function ContentEditor({ content }: { content: EditableContent }) {
  const [wasEditing, setWasEditing] = useState(false);
  const { isEditing, setIsEditing } = useEditor();
  const [editorValue, setEditorValue] = useState(content.view);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const intl = useIntl();
  const router = useRouter();
  const saveMutation = useMutation({
    mutationFn: (json: { name: string; title: string; hidden: boolean; view: string }) =>
      rpc.api.content.save.$post({ json }).then((r) => {
        if (!r.ok) throw new Error('save failed');
        return r.json();
      }),
  });

  useEffect(() => {
    const handleOnBeforeUnload = (evt: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) evt.returnValue = 'You have unfinished changes!';
    };
    window.addEventListener('beforeunload', handleOnBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleOnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (isEditing) setWasEditing(true);
  }, [isEditing]);

  useEffect(() => {
    const save = async () => {
      const title = (
        editorValue.match(/<h1>(.*?)<\/h1>/)?.[1] ||
        editorValue.split('</p>')[0].split('\n')[0].trim() ||
        content.title ||
        ''
      ).replace(/<[^>]*>?/g, '');

      try {
        await saveMutation.mutateAsync({ name: content.name, title, hidden: content.hidden, view: editorValue });
      } catch {
        setToast({ msg: intl.formatMessage(messages.error), ok: false });
        setIsEditing(true);
        return;
      }
      setToast({ msg: intl.formatMessage(messages.posted), ok: true });
      setHasUnsavedChanges(false);
      router.invalidate();
    };

    if (wasEditing && !isEditing) {
      setWasEditing(false);
      save();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, wasEditing]);

  const handleEditorChange = useCallback((_name: string, value: string) => {
    setEditorValue(value);
    setHasUnsavedChanges(true);
  }, []);

  return (
    <>
      {isEditing ? (
        <Editor
          name="content-editor"
          section={content.section}
          album={content.album}
          defaultValue={content.view}
          onChange={handleEditorChange}
        />
      ) : null}
      {toast ? (
        <div
          className={`${editorStyles.toast} ${toast.ok ? editorStyles.toastSuccess : editorStyles.toastError} notranslate`}
          role="alert"
          onClick={() => setToast(null)}
        >
          {toast.msg}
        </div>
      ) : null}
    </>
  );
}
