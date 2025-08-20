import { FormatBold, FormatListBulleted, FormatStrikethrough, Title } from '@mui/icons-material';
import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/react';
import { styled } from '@mui/material';

const StyledBubbleMenu = styled(BubbleMenu)`
  & {
    background-color: ${(props) => props.theme.palette.background.default};
    border-right: 1px solid ${(props) => props.theme.palette.primary.light};
    border-radius: ${(props) => props.theme.shape.borderRadius};
  }

  & button {
    border: 1px solid ${(props) => props.theme.palette.primary.light};
    border-right: 0;
  }

  & button.is-active {
    background-color: ${(props) => props.theme.palette.primary.light};
    color: ${(props) => props.theme.palette.text.primary};
  }
`;

export default function EditorToolbar({
  editor,
  disableHeadings,
}: {
  editor: Editor | null;
  disableHeadings?: boolean;
}) {
  if (!editor) return null;

  return (
    <StyledBubbleMenu className="bubble-menu" editor={editor}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        <FormatBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
      >
        <FormatStrikethrough />
      </button>
      {!disableHeadings && (
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        >
          <Title />
        </button>
      )}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
      >
        <FormatListBulleted />
      </button>
    </StyledBubbleMenu>
  );
}
