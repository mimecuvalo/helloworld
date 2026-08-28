import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'i18n';
import { EditorProvider, useEditor } from 'lib/editor-context';

// The editor is five views onto one row. The wysiwyg and the html tab both write
// the same `view` column, and the html tab is the one that wins: it is the only
// place an author can put markup tiptap's schema would throw away.

const rpc = vi.hoisted(() => ({
  editable: vi.fn(),
  sitemap: vi.fn(),
  save: vi.fn(),
  del: vi.fn(),
}));

vi.mock('lib/rpc', () => ({
  rpc: {
    api: {
      content: {
        editable: { $get: rpc.editable },
        sitemap: { $get: rpc.sitemap },
        save: { $post: rpc.save },
        delete: { $post: rpc.del },
      },
    },
  },
}));

const router = vi.hoisted(() => ({ invalidate: vi.fn(), navigate: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ useRouter: () => router }));

import ContentEditor from 'components/content/ContentEditor';

const SITEMAP = [
  { username: 'alice', section: 'main', album: '', name: 'writing', title: 'writing', hidden: false },
  { username: 'alice', section: 'main', album: '', name: 'photos', title: 'photos', hidden: false },
  { username: 'alice', section: 'photos', album: 'main', name: 'trips', title: 'trips', hidden: false },
];

const ROW = {
  section: 'writing',
  album: '',
  name: 'second-post',
  title: 'Second Post',
  template: '',
  thumb: '',
  hidden: false,
  style: 'p { color: red }',
  code: 'console.info(1)',
  view: '<p>hello</p>',
};

const CONTENT = {
  username: 'alice',
  name: 'second-post',
  section: 'writing',
  album: '',
  title: 'Second Post',
  hidden: false,
  view: '<p>hello</p>',
};

// The one control outside the editor that drives it: the header's edit toggle.
function Harness({ content }: { content: typeof CONTENT }) {
  const { isEditing, setIsEditing } = useEditor();
  return (
    <>
      <button type="button" onClick={() => setIsEditing(!isEditing)}>
        toggle edit
      </button>
      <ContentEditor content={content} />
    </>
  );
}

function renderEditor(content = CONTENT) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <IntlProvider defaultLocale="en" locale="en" messages={{}}>
      <QueryClientProvider client={client}>
        <EditorProvider>
          <Harness content={content} />
        </EditorProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
}

const savedPayload = () => rpc.save.mock.calls.at(-1)![0].json;

async function startEditing(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'toggle edit' }));
  // The tabs render straight away; the panel waits on the row being fetched, and
  // nothing is editable — or saveable — until it lands.
  await screen.findByRole('tabpanel');
}

const stopEditing = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'toggle edit' }));

// The pickers show the page's own placement straight away, but stay disabled
// until the sitemap says what else there is to choose.
async function sectionPicker() {
  const select = screen.getByRole('combobox', { name: 'section' });
  await waitFor(() => expect(select).toBeEnabled());
  return select;
}

beforeAll(() => {
  // ProseMirror and CodeMirror both measure; jsdom has no layout.
  const emptyRect = { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } as DOMRect;
  Range.prototype.getClientRects = () => Object.assign([], { item: () => null });
  Range.prototype.getBoundingClientRect = () => emptyRect;
});

beforeEach(() => {
  vi.clearAllMocks();
  rpc.editable.mockResolvedValue({ ok: true, json: async () => ROW });
  rpc.sitemap.mockResolvedValue({ ok: true, json: async () => SITEMAP });
  rpc.save.mockResolvedValue({ ok: true, json: async () => ({ ...CONTENT }) });
});

describe('the tabs', () => {
  it('offers the five views onto the row', async () => {
    const user = userEvent.setup();
    renderEditor();
    await startEditing(user);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Content',
      'HTML',
      'CSS',
      'JS',
      'Options',
    ]);
  });

  it('shows nothing at all until editing starts', () => {
    renderEditor();

    expect(screen.queryByRole('tab')).toBeNull();
    expect(rpc.editable).not.toHaveBeenCalled();
  });

  it('opens each source view on the field it edits', async () => {
    const user = userEvent.setup();
    renderEditor();
    await startEditing(user);

    // The source views are a lazy chunk of their own, so each one is awaited.
    await user.click(screen.getByRole('tab', { name: 'HTML' }));
    expect(await screen.findByRole('textbox', { name: 'html' })).toHaveTextContent('<p>hello</p>');

    await user.click(screen.getByRole('tab', { name: 'CSS' }));
    expect(await screen.findByRole('textbox', { name: 'css' })).toHaveTextContent('p { color: red }');

    await user.click(screen.getByRole('tab', { name: 'JS' }));
    expect(await screen.findByRole('textbox', { name: 'js' })).toHaveTextContent('console.info(1)');
  });
});

describe('where a page is filed', () => {
  it('shows the page where it sits, and saves it where you move it', async () => {
    const user = userEvent.setup();
    renderEditor();
    await startEditing(user);

    const section = await sectionPicker();
    expect(section).toHaveValue('writing');
    await user.selectOptions(section, 'photos');
    await user.selectOptions(screen.getByRole('combobox', { name: 'album' }), 'trips');

    await stopEditing(user);

    await waitFor(() => expect(rpc.save).toHaveBeenCalled());
    expect(savedPayload()).toMatchObject({ name: 'second-post', section: 'photos', album: 'trips' });
  });

  it('offers a section nowhere to go, because there is nowhere above it', async () => {
    const user = userEvent.setup();
    rpc.editable.mockResolvedValue({ ok: true, json: async () => ({ ...ROW, section: 'main', name: 'writing' }) });
    renderEditor({ ...CONTENT, section: 'main', name: 'writing' });
    await startEditing(user);

    expect(screen.queryByRole('combobox', { name: 'section' })).toBeNull();
  });

  it('lets an album pick a parent section, but not an album to sit in', async () => {
    const user = userEvent.setup();
    rpc.editable.mockResolvedValue({
      ok: true,
      json: async () => ({ ...ROW, section: 'photos', album: 'main', name: 'trips' }),
    });
    renderEditor({ ...CONTENT, section: 'photos', album: 'main', name: 'trips' });
    await startEditing(user);

    const section = await sectionPicker();
    expect(section).toHaveValue('photos');
    expect(screen.queryByRole('combobox', { name: 'album' })).toBeNull();

    // Sent to main, an album stops being one and becomes a section itself.
    await user.selectOptions(section, 'main');
    await stopEditing(user);

    await waitFor(() => expect(rpc.save).toHaveBeenCalled());
    expect(savedPayload()).toMatchObject({ name: 'trips', section: 'main', album: '' });
  });
});

describe('saving', () => {
  it('sends every field the tabs edit, from the row as stored', async () => {
    const user = userEvent.setup();
    renderEditor();
    await startEditing(user);
    await stopEditing(user);

    await waitFor(() => expect(rpc.save).toHaveBeenCalled());
    expect(savedPayload()).toMatchObject({
      name: 'second-post',
      newName: 'second-post',
      section: 'writing',
      album: '',
      style: 'p { color: red }',
      code: 'console.info(1)',
      view: '<p>hello</p>',
    });
  });

  it('keeps the html tab as written, rather than what tiptap would make of it', async () => {
    const user = userEvent.setup();
    renderEditor();
    await startEditing(user);

    await user.click(screen.getByRole('tab', { name: 'HTML' }));
    const html = await screen.findByRole('textbox', { name: 'html' });
    await user.click(html);
    await user.keyboard('<custom-element>keep me</custom-element>');

    await stopEditing(user);

    await waitFor(() => expect(rpc.save).toHaveBeenCalled());
    expect(savedPayload().view).toContain('<custom-element>keep me</custom-element>');
  });

  it('carries the options across', async () => {
    const user = userEvent.setup();
    renderEditor();
    await startEditing(user);

    await user.click(screen.getByRole('tab', { name: 'Options' }));
    await user.clear(screen.getByPlaceholderText('name'));
    await user.type(screen.getByPlaceholderText('name'), 'renamed');
    await user.click(screen.getByRole('checkbox'));

    await stopEditing(user);

    await waitFor(() => expect(rpc.save).toHaveBeenCalled());
    expect(savedPayload()).toMatchObject({ name: 'second-post', newName: 'renamed', hidden: true });
  });

  it('says what went wrong and stays open when the name is taken', async () => {
    rpc.save.mockResolvedValue({ ok: false, json: async () => ({ error: 'duplicate-name' }) });
    const user = userEvent.setup();
    renderEditor();
    await startEditing(user);
    await stopEditing(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something else already has that name.');
    expect(screen.getByRole('tab', { name: 'HTML' })).toBeInTheDocument();
  });
});
