import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCallback, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEditor as useTipTapEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import Editor from 'components/editor/Editor';
import type { AddedMedia } from 'components/editor/image-upload';
import EditorToolbar from 'components/editor/Toolbar';
import Image from 'components/editor/ImageExtension';
import usePageImageDrop from 'components/editor/usePageImageDrop';
import { EditorProvider, useEditor } from 'lib/editor-context';
import styles from 'components/editor/editor.module.css';

beforeAll(() => {
  // ProseMirror measures the selection to place the bubble menu; jsdom has no layout.
  const emptyRect = { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } as DOMRect;
  Range.prototype.getClientRects = () => Object.assign([], { item: () => null });
  Range.prototype.getBoundingClientRect = () => emptyRect;
});

beforeEach(() => {
  changes.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// What the editor would save: the rendered dom carries ProseMirror's own
// scaffolding (and the upload placeholder, which is a decoration), so assert on
// the html the editor hands back instead.
const changes: string[] = [];
const savedHtml = () => changes[changes.length - 1] || '';
const placeholder = () => document.querySelector<HTMLImageElement>(`img.${styles.uploadingImage}`);

function imageFile() {
  return new File(['not-really-a-png'], 'photo.png', { type: 'image/png' });
}

// The three sizes the server derives from an upload, as the editor sees them.
const DERIVED = {
  original: 'https://s3.amazonaws.com/b/main/original/photo.png',
  medium: 'https://s3.amazonaws.com/b/main/photo.png',
  thumb: 'https://s3.amazonaws.com/b/main/thumbs/photo.png',
  lqip: -123456,
  width: 800,
  height: 600,
};

// Holds the upload open until the test lets it finish, so the placeholder can be
// looked at while it's still standing in for the image.
function stubUpload({ fails = false } = {}) {
  let finish = () => {};
  const uploaded = new Promise<void>((resolve) => {
    finish = resolve;
  });

  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/upload-file')) {
        return json({ url: 'https://s3.example/upload', fields: { bucket: 'b', key: 'main/original/photo.png' } });
      }
      if (String(input).startsWith('/api/derive-image')) return json(DERIVED);
      await uploaded;
      if (fails) throw new Error('upload failed');
      return new Response('', { status: 200 });
    })
  );

  return { finish };
}

function pasteFile(element: HTMLElement, file: File) {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
  event.clipboardData = {
    items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
    files: [file],
    types: ['Files'],
    getData: () => '',
  };
  element.dispatchEvent(event);
}

function dragEvent(type: string, files: File[]) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event & { dataTransfer: unknown };
  event.dataTransfer = { files, types: files.length ? ['Files'] : [], dropEffect: 'none' };
  return event;
}

const thumbs: string[] = [];

function Harness({ content = '' }: { content?: string }) {
  const [value, setValue] = useState(content);
  const handleChange = useCallback((_name: string, next: string) => {
    changes.push(next);
    setValue(next);
  }, []);
  const handleMediaAdd = useCallback((media: AddedMedia) => {
    thumbs.push(media.thumb);
  }, []);

  return (
    <EditorProvider>
      <Editor
        name="test-editor"
        section="main"
        album=""
        defaultValue={value}
        onChange={handleChange}
        onMediaAdd={handleMediaAdd}
      />
    </EditorProvider>
  );
}

describe('uploading an image into the editor', () => {
  it('stands a dimmed copy of the file in for the image until the upload lands', async () => {
    thumbs.length = 0;
    const { finish } = stubUpload();
    render(<Harness />);
    const el = await screen.findByRole('textbox');
    el.focus();

    pasteFile(el, imageFile());

    await waitFor(() => expect(placeholder()).toBeTruthy());
    expect(placeholder()?.src).toMatch(/^data:image\/png;base64,/);

    finish();

    await waitFor(() => expect(savedHtml()).toContain('<img'));
    // The medium size is what the post shows, linked to the untouched original
    // and carrying the placeholder that stands in for it while it loads.
    expect(savedHtml()).toContain(`<a href="${DERIVED.original}">`);
    expect(savedHtml()).toContain(`src="${DERIVED.medium}"`);
    expect(savedHtml()).toContain('--lqip: -123456');
    expect(savedHtml()).toContain('width="800" height="600"');
    expect(placeholder()).toBeNull();
    // The post takes its thumbnail from the small size, not the one on show.
    expect(thumbs).toContain(DERIVED.thumb);
    // The placeholder lives in a decoration, not in the document: a post made
    // mid-upload can't carry the whole file with it.
    expect(changes.some((value) => value.includes('data:'))).toBe(false);
  });

  it('takes the placeholder back down when the upload fails', async () => {
    const { finish } = stubUpload({ fails: true });
    render(<Harness />);
    const el = await screen.findByRole('textbox');
    el.focus();

    pasteFile(el, imageFile());
    await waitFor(() => expect(placeholder()).toBeTruthy());
    finish();

    await waitFor(() => expect(placeholder()).toBeNull());
    expect(savedHtml()).not.toContain('<img');
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to upload image.');
  });
});

// The image toolbar drives the node directly, so it only needs the editor the
// bubble menu reads from — not the upload path around it.
function ToolbarHarness({ content }: { content: string }) {
  const editor = useTipTapEditor({
    extensions: [StarterKit, Image],
    content,
    onUpdate: ({ editor }) => changes.push(editor.getHTML()),
    onCreate: ({ editor }) => changes.push(editor.getHTML()),
    immediatelyRender: false,
  });

  const selectImage = () => {
    let pos = -1;
    editor?.state.doc.descendants((node, at) => {
      if (pos < 0 && node.type.name === 'image') pos = at;
    });
    if (pos >= 0) editor?.chain().focus().setNodeSelection(pos).run();
  };

  return (
    <div>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <button type="button" onClick={selectImage}>
        select the image
      </button>
    </div>
  );
}

describe('the image toolbar', () => {
  it('captions the selected image, writing it out as a figure', async () => {
    const user = userEvent.setup();
    render(<ToolbarHarness content='<img src="https://img.example/cat.png">' />);

    await user.click(await screen.findByRole('button', { name: 'select the image' }));
    await user.click(await screen.findByRole('button', { name: 'caption' }));
    await user.type(await screen.findByRole('textbox', { name: 'image caption' }), 'a cat, mid-nap');
    await user.click(screen.getByRole('button', { name: 'apply caption' }));

    await waitFor(() => expect(savedHtml()).toContain('<figcaption>a cat, mid-nap</figcaption>'));
    expect(savedHtml()).toContain('<figure><img src="https://img.example/cat.png" loading="lazy">');
  });

  it('reads a caption back off a figure, and drops it again when emptied', async () => {
    const user = userEvent.setup();
    render(
      <ToolbarHarness content='<figure><img src="https://img.example/cat.png"><figcaption>a cat</figcaption></figure>' />
    );

    await waitFor(() => expect(savedHtml()).toContain('<figcaption>a cat</figcaption>'));

    await user.click(await screen.findByRole('button', { name: 'select the image' }));
    await user.click(await screen.findByRole('button', { name: 'caption' }));
    const input = await screen.findByRole('textbox', { name: 'image caption' });
    expect(input).toHaveValue('a cat');

    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'apply caption' }));

    await waitFor(() => expect(savedHtml()).not.toContain('<figure>'));
    expect(savedHtml()).toContain('src="https://img.example/cat.png"');
  });

  it('round-trips an image that knows its original and its placeholder', async () => {
    const html =
      '<figure><a href="https://img.example/original/cat.png">' +
      '<img src="https://img.example/cat.png" width="800" height="600" loading="lazy" style="--lqip:-123456">' +
      '</a><figcaption>a cat</figcaption></figure>';
    render(<ToolbarHarness content={html} />);

    await waitFor(() => expect(savedHtml()).toContain('<figcaption>a cat</figcaption>'));
    expect(savedHtml()).toContain('<a href="https://img.example/original/cat.png">');
    expect(savedHtml()).toContain('src="https://img.example/cat.png"');
    expect(savedHtml()).toContain('width="800" height="600"');
    expect(savedHtml()).toContain('--lqip: -123456');
  });

  it('leaves a link alone when the image is not all it holds', async () => {
    render(
      <ToolbarHarness content='<p><a href="https://elsewhere/"><img src="https://img.example/icon.png">home</a></p>' />
    );

    await waitFor(() => expect(savedHtml()).toContain('<img'));
    // The label survives, and the image stays inside the link rather than
    // becoming a block of its own that swallowed it.
    expect(savedHtml()).toContain('home</a>');
  });

  it('deletes the selected image', async () => {
    const user = userEvent.setup();
    render(<ToolbarHarness content='<p>before</p><img src="https://img.example/cat.png"><p>after</p>' />);

    await user.click(await screen.findByRole('button', { name: 'select the image' }));
    await user.click(await screen.findByRole('button', { name: 'delete image' }));

    await waitFor(() => expect(savedHtml()).not.toContain('<img'));
    expect(savedHtml()).toContain('before');
    expect(savedHtml()).toContain('after');
  });
});

function DropHarness() {
  const { editor } = useEditor();
  const isDraggingImage = usePageImageDrop({ editor, section: 'main', album: '' });
  const handleChange = useCallback((_name: string, next: string) => changes.push(next), []);

  return (
    <>
      {isDraggingImage ? <div role="status">drop it</div> : null}
      <Editor name="test-editor" section="main" album="" defaultValue="<p>hello</p>" onChange={handleChange} />
    </>
  );
}

describe('dropping an image on the page around the editor', () => {
  it('announces the drop and adds the image to what is being written', async () => {
    const { finish } = stubUpload();
    render(
      <EditorProvider>
        <DropHarness />
      </EditorProvider>
    );
    await screen.findByRole('textbox');

    window.dispatchEvent(dragEvent('dragenter', [imageFile()]));
    expect(await screen.findByRole('status')).toHaveTextContent('drop it');

    document.body.dispatchEvent(dragEvent('drop', [imageFile()]));

    await waitFor(() => expect(placeholder()).toBeTruthy());
    expect(screen.queryByRole('status')).toBeNull();

    finish();

    await waitFor(() => expect(savedHtml()).toContain('<img'));
    // Dropped away from the editor there's no position to speak of, so it lands
    // after what's already written.
    expect(savedHtml().indexOf('hello')).toBeLessThan(savedHtml().indexOf('<img'));
  });
});
