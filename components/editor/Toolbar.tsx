import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import styles from './editor.module.css';

export default function EditorToolbar({
  editor,
  disableHeadings,
}: {
  editor: Editor | null;
  disableHeadings?: boolean;
}) {
  if (!editor) return null;

  const btn = (active: boolean) => (active ? styles.isActive : undefined);

  return (
    <BubbleMenu editor={editor} className={styles.bubbleMenu}>
      <button
        type="button"
        aria-label="bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive('bold'))}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3a1.5 1.5 0 0 1 0 3h-3v-3zm3.5 9H10v-3h3.5a1.5 1.5 0 0 1 0 3z" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btn(editor.isActive('strike'))}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
        </svg>
      </button>
      {!disableHeadings ? (
        <button
          type="button"
          aria-label="heading"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btn(editor.isActive('heading', { level: 1 }))}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5 4v3h5.5v12h3V7H19V4z" />
          </svg>
        </button>
      ) : null}
      <button
        type="button"
        aria-label="bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive('bulletList'))}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      </button>
    </BubbleMenu>
  );
}
