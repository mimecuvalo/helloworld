import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor as useTipTapEditor, EditorContent, type Editor as TipTapEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';
import { Emoji } from '@tiptap/extension-emoji';
import type { EditorView } from '@tiptap/pm/view';
import uploadFileToS3 from 'lib/s3-upload';
import { useEditor } from 'lib/editor-context';
import Iframe from './IframeExtension';
import { insertUnfurlInfo, isUnfurlable, unfurl } from './unfurl';
import { emojiSuggestion, unicodeEmojis } from './EmojiSuggestion';
import EditorToolbar from './Toolbar';
import styles from './editor.module.css';

type EditorProps = {
  defaultValue?: string;
  name: string;
  section: string;
  album: string;
  onBlur?: () => void;
  onChange: (name: string, value: string) => void;
  onMediaAdd?: (url: string) => void;
  placeholder?: string;
};

export default function Editor({
  name,
  section,
  album,
  onBlur,
  onChange,
  onMediaAdd,
  placeholder,
  defaultValue,
}: EditorProps) {
  const { setEditor } = useEditor();
  // Paste handlers are built into the editor's config, so they can't close over
  // the editor itself; this ref hands it back to them.
  const editorRef = useRef<TipTapEditor | null>(null);
  const hasFocused = useRef(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleUploadImage = useCallback(
    async (file: File) => {
      try {
        const url = await uploadFileToS3(file, file.name, section, album);
        onMediaAdd?.(url);
        return url;
      } catch {
        setToastMsg('Failed to upload image.');
      }
    },
    [section, album, onMediaAdd]
  );

  // Pasting a url (or embed code) on its own unfurls it into an embed; pasting
  // one over a selection is left to the Link extension, which turns the
  // selection into a link instead.
  const handleUnfurl = useCallback(
    async (text: string) => {
      const info = await unfurl(text);
      // Tiptap rebuilds the editor whenever its config changes, so the live one
      // has to be read back here rather than captured when the paste happened.
      const editor = editorRef.current;
      if (!editor || editor.isDestroyed) return;
      insertUnfurlInfo(editor, info, text);
      if (info.isError) setToastMsg('Failed to unfurl that link.');
      else if (info.image) onMediaAdd?.(info.image);
    },
    [onMediaAdd]
  );

  const handleChange = useCallback(
    (editor: TipTapEditor) => {
      onChange(name, editor.getHTML());
    },
    [name, onChange]
  );

  const handleFocus = useCallback(() => {
    hasFocused.current = true;
  }, []);
  const handleBlur = useCallback(() => {
    if (hasFocused.current) onBlur?.();
  }, [onBlur]);

  const editor = useTipTapEditor(
    {
      extensions: [
        // Clicking a link should put the caret in it so the toolbar can edit it,
        // not navigate away from the page being edited.
        StarterKit.configure({ link: { openOnClick: false, defaultProtocol: 'https' } }),
        Image.configure({ HTMLAttributes: { class: 'editor-image' } }),
        Placeholder.configure({ placeholder }),
        // `:` opens the picker. The emoji set is ~500kb of JSON, which only
        // lands in this chunk because ContentEditor is lazy-loaded.
        Emoji.configure({ emojis: unicodeEmojis, suggestion: emojiSuggestion }),
        Iframe,
      ],
      content: defaultValue || '',
      onUpdate: ({ editor }: { editor: TipTapEditor }) => handleChange(editor),
      onFocus: handleFocus,
      autofocus: true,
      onBlur: handleBlur,
      editorProps: {
        handlePaste: (view: EditorView, event: ClipboardEvent) => {
          const items = Array.from(event.clipboardData?.items || []);
          const imageItem = items.find((item) => item.type.indexOf('image') === 0);
          if (imageItem) {
            const file = imageItem.getAsFile();
            if (file instanceof File) {
              handleUploadImage(file).then((url) => {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.insert(view.state.selection.anchor, node);
                return view.dispatch(transaction);
              });
              return true;
            }
          }
          const text = event.clipboardData?.getData('text/plain');
          if (text && view.state.selection.empty && isUnfurlable(text)) {
            handleUnfurl(text);
            return true;
          }
          return false;
        },
        handleDrop: (view: EditorView, event: DragEvent) => {
          const files = Array.from(event.dataTransfer?.files || []);
          const imageFile = files.find((file) => file.type.indexOf('image') === 0);
          if (imageFile instanceof File) {
            handleUploadImage(imageFile).then((url) => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (!coordinates) return;
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              return view.dispatch(transaction);
            });
            return true;
          }
          return false;
        },
      },
      immediatelyRender: false,
    },
    [placeholder, handleChange, handleFocus, handleBlur, handleUploadImage, handleUnfurl]
  );

  editorRef.current = editor;

  useEffect(() => {
    setEditor(editor);
  }, [editor, setEditor]);

  useEffect(() => {
    // Guard against a destroyed editor (Tiptap recreates it when the deps change,
    // and getHTML() on a destroyed instance throws on a null schema).
    if (editor && !editor.isDestroyed && defaultValue !== undefined && editor.getHTML() !== defaultValue) {
      editor.commands.setContent(defaultValue, { emitUpdate: false });
    }
  }, [editor, defaultValue]);

  if (!editor) {
    return <div style={{ width: '100%', minHeight: '33vh' }} aria-busy="true" />;
  }

  return (
    <>
      <div className={styles.editor}>
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} className="notranslate" />
      </div>

      {toastMsg ? (
        <div
          className={`${styles.toast} ${styles.toastError} notranslate`}
          role="alert"
          onClick={() => setToastMsg('')}
        >
          {toastMsg}
        </div>
      ) : null}
    </>
  );
}
