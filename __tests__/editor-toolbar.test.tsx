import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor, useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import EditorToolbar from 'components/editor/Toolbar';
import styles from 'components/editor/editor.module.css';

beforeAll(() => {
  // ProseMirror measures the selection to place the bubble menu; jsdom has no layout.
  const emptyRect = { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } as DOMRect;
  Range.prototype.getClientRects = () => Object.assign([], { item: () => null });
  Range.prototype.getBoundingClientRect = () => emptyRect;
});

// The bubble menu only attaches itself to the DOM while the editor is focused
// and something is selected, so every case drives it through these controls.
function Harness({
  content,
  onHTML,
  withLinks = true,
}: {
  content: string;
  onHTML?: (html: string) => void;
  withLinks?: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: withLinks ? { openOnClick: false, defaultProtocol: 'https' } : false })],
    content,
    onUpdate: ({ editor }) => onHTML?.(editor.getHTML()),
    immediatelyRender: false,
  });

  return (
    <div>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <button type="button" onClick={() => editor?.chain().focus().setTextSelection({ from: 1, to: 6 }).run()}>
        select first word
      </button>
      <button type="button" onClick={() => editor?.chain().focus().setTextSelection(3).run()}>
        put caret in first word
      </button>
    </div>
  );
}

describe('EditorToolbar link editor', () => {
  it('turns the selection into a link, defaulting to https', async () => {
    const user = userEvent.setup();
    let html = '';
    render(<Harness content="<p>hello world</p>" onHTML={(next) => (html = next)} />);

    await user.click(await screen.findByRole('button', { name: 'select first word' }));
    await user.click(await screen.findByRole('button', { name: 'link' }));
    await user.type(await screen.findByRole('textbox', { name: 'link url' }), 'example.com');
    await user.click(screen.getByRole('button', { name: 'apply link' }));

    await waitFor(() => expect(html).toContain('href="https://example.com"'));
    expect(html).toContain('>hello</a>');
  });

  it('shows the link under the caret and removes it', async () => {
    const user = userEvent.setup();
    let html = '';
    render(<Harness content='<p><a href="https://example.com">hello</a> world</p>' onHTML={(next) => (html = next)} />);

    await user.click(await screen.findByRole('button', { name: 'put caret in first word' }));

    expect(await screen.findByRole('link', { name: 'open link' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByRole('button', { name: 'example.com' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'remove link' }));
    await waitFor(() => expect(html).toBe('<p>hello world</p>'));
  });

  it('edits an existing link rather than nesting a new one', async () => {
    const user = userEvent.setup();
    let html = '';
    render(<Harness content='<p><a href="https://example.com">hello</a> world</p>' onHTML={(next) => (html = next)} />);

    await user.click(await screen.findByRole('button', { name: 'put caret in first word' }));
    await user.click(await screen.findByRole('button', { name: 'example.com' }));

    const input = await screen.findByRole<HTMLInputElement>('textbox', { name: 'link url' });
    expect(input).toHaveValue('https://example.com');

    await user.clear(input);
    await user.type(input, 'hi@example.com{Enter}');

    await waitFor(() => expect(html).toContain('href="mailto:hi@example.com"'));
    expect(html.match(/<a /g)).toHaveLength(1);
  });

  it('keeps button states in step with the editor', async () => {
    const user = userEvent.setup();
    render(<Harness content="<p>hello world</p>" />);

    await user.click(await screen.findByRole('button', { name: 'select first word' }));

    const bold = await screen.findByRole('button', { name: 'bold' });
    expect(bold).not.toHaveClass(styles.isActive);

    await user.click(bold);
    await waitFor(() => expect(bold).toHaveClass(styles.isActive));
  });

  it('swaps the formatting buttons out for the link editor', async () => {
    const user = userEvent.setup();
    render(<Harness content="<p>hello world</p>" />);

    await user.click(await screen.findByRole('button', { name: 'select first word' }));
    await user.click(await screen.findByRole('button', { name: 'link' }));

    await screen.findByRole('textbox', { name: 'link url' });
    expect(screen.queryByRole('button', { name: 'bold' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'link' })).not.toBeInTheDocument();
  });

  it('keeps the formatting buttons when linked text is selected', async () => {
    const user = userEvent.setup();
    render(<Harness content='<p><a href="https://example.com">hello</a> world</p>' />);

    await user.click(await screen.findByRole('button', { name: 'select first word' }));

    expect(await screen.findByRole('button', { name: 'bold' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'open link' })).not.toBeInTheDocument();
  });

  it('renders nothing for an editor that has been destroyed', () => {
    // Tiptap nulls out the view and schema on destroy while React may still
    // render the toolbar once more against the stale instance.
    const editor = new Editor({
      extensions: [StarterKit],
      content: '<p>hello world</p>',
    });
    editor.destroy();

    expect(() => render(<EditorToolbar editor={editor} />)).not.toThrow();
    expect(screen.queryByRole('button', { name: 'bold' })).not.toBeInTheDocument();
  });

  it('toggles inline code', async () => {
    const user = userEvent.setup();
    let html = '';
    render(<Harness content="<p>hello world</p>" onHTML={(next) => (html = next)} />);

    await user.click(await screen.findByRole('button', { name: 'select first word' }));
    await user.click(await screen.findByRole('button', { name: 'inline code' }));

    await waitFor(() => expect(html).toBe('<p><code>hello</code> world</p>'));
    expect(screen.getByRole('button', { name: 'inline code' })).toHaveClass(styles.isActive);
  });

  it('hides the link button when the editor has no link mark', async () => {
    const user = userEvent.setup();
    render(<Harness content="<p>hello world</p>" withLinks={false} />);

    await user.click(await screen.findByRole('button', { name: 'select first word' }));

    expect(await screen.findByRole('button', { name: 'bold' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'link' })).not.toBeInTheDocument();
  });
});
