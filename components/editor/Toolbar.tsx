import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import { FontBoldIcon, HeadingIcon, ListBulletIcon, StrikethroughIcon } from '@radix-ui/react-icons';
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
        <FontBoldIcon width={18} height={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btn(editor.isActive('strike'))}
      >
        <StrikethroughIcon width={18} height={18} aria-hidden="true" />
      </button>
      {!disableHeadings ? (
        <button
          type="button"
          aria-label="heading"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btn(editor.isActive('heading', { level: 1 }))}
        >
          <HeadingIcon width={18} height={18} aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="button"
        aria-label="bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive('bulletList'))}
      >
        <ListBulletIcon width={18} height={18} aria-hidden="true" />
      </button>
    </BubbleMenu>
  );
}
