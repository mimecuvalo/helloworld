import { useEffect, useState } from 'react';
import { Editor as TipTapEditor, EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useIntl, F, defineMessages } from 'i18n';
import { rpc } from 'lib/rpc';
import EditorToolbar from '../editor/Toolbar';
import editorStyles from '../editor/editor.module.css';
import styles from './content.module.css';

const messages = defineMessages({
  error: { defaultMessage: 'Error updating content.' },
});

export default function CommentsEditor({ content }: { content: { username: string; name: string } }) {
  const intl = useIntl();
  const router = useRouter();
  const [toastMsg, setToastMsg] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [editorKeyToClearState, setEditorKeyToClearState] = useState(0);

  const postMutation = useMutation({
    mutationFn: (json: { username: string; name: string; content: string }) =>
      rpc.api['content-remote'].comment.$post({ json }).then((r) => {
        if (!r.ok) throw new Error('post failed');
        return r.json();
      }),
  });

  const handlePost = async () => {
    try {
      await postMutation.mutateAsync({ username: content.username, name: content.name, content: commentContent });
      setEditorKeyToClearState((k) => k + 1);
      setCommentContent('');
      router.invalidate();
    } catch {
      setToastMsg(intl.formatMessage(messages.error));
    }
  };

  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
      const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
      if (isAccelKey && evt.key === 'Enter') handlePost();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: false, horizontalRule: false, link: false }),
        Placeholder.configure({ placeholder: 'Hello, world.' }),
      ],
      content: '',
      onUpdate: ({ editor }: { editor: TipTapEditor }) => setCommentContent(editor.getHTML()),
      immediatelyRender: false,
    },
    [editorKeyToClearState]
  );

  return (
    <>
      <div className={`${editorStyles.editor} ${styles.commentEditor}`}>
        <EditorToolbar editor={editor} disableHeadings />
        <EditorContent editor={editor} className="notranslate" />
      </div>
      <button
        type="button"
        className={`btn ${styles.commentPost}`}
        disabled={postMutation.isPending}
        onClick={handlePost}
      >
        <F defaultMessage="post" />
      </button>

      {toastMsg ? (
        <div
          className={`${editorStyles.toast} ${editorStyles.toastError} notranslate`}
          role="alert"
          onClick={() => setToastMsg('')}
        >
          {toastMsg}
        </div>
      ) : null}
    </>
  );
}
