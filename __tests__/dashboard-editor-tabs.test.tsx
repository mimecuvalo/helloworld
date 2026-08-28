import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'i18n';
import { EditorProvider } from 'lib/editor-context';

// The composer is the same five tabs as the post editor, over a row that does
// not exist yet: no delete, and a slug that is a request rather than a rename.

const rpc = vi.hoisted(() => ({ sitemap: vi.fn(), post: vi.fn(), container: vi.fn() }));

vi.mock('lib/rpc', () => ({
  rpc: {
    api: {
      content: {
        sitemap: { $get: rpc.sitemap },
        post: { $post: rpc.post },
        container: { $post: rpc.container },
      },
    },
  },
}));

import DashboardEditor from 'components/dashboard/DashboardEditor';
import { withCreated } from 'components/editor/PlacementSelects';

const SITEMAP = [
  { username: 'alice', section: 'main', album: '', name: 'writing', title: 'writing', hidden: false },
  { username: 'alice', section: 'writing', album: 'main', name: 'drafts', title: 'drafts', hidden: true },
];

function renderComposer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <IntlProvider defaultLocale="en" locale="en" messages={{}}>
      <QueryClientProvider client={client}>
        <EditorProvider>
          <DashboardEditor username="alice" />
        </EditorProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
}

const postedPayload = () => rpc.post.mock.calls.at(-1)![0].json;
const sectionSelect = () => screen.getByRole('combobox', { name: 'section' });
const albumSelect = () => screen.getByRole('combobox', { name: 'album' });
const openComposer = () => screen.findByRole('tabpanel');

beforeAll(() => {
  const emptyRect = { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } as DOMRect;
  Range.prototype.getClientRects = () => Object.assign([], { item: () => null });
  Range.prototype.getBoundingClientRect = () => emptyRect;
});

beforeEach(() => {
  vi.clearAllMocks();
  document.cookie = 'sectionAndAlbum=;path=/;max-age=0';
  rpc.sitemap.mockResolvedValue({ ok: true, json: async () => SITEMAP });
  rpc.post.mockResolvedValue({ ok: true, json: async () => ({ username: 'alice', name: 'a-post' }) });
  rpc.container.mockImplementation(async () => {
    const created = { section: 'main', album: '', name: 'travel', title: 'travel', hidden: false };
    // The sitemap the component refetches has the new row in it by now.
    rpc.sitemap.mockResolvedValue({ ok: true, json: async () => [...SITEMAP, { ...created, username: 'alice' }] });
    return { ok: true, json: async () => created };
  });
});

describe('the composer', () => {
  it('offers the same five tabs', async () => {
    renderComposer();
    await openComposer();

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Content',
      'HTML',
      'CSS',
      'JS',
      'Options',
    ]);
  });

  it('keeps post reachable from every tab', async () => {
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    expect(screen.getByRole('button', { name: 'post' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'CSS' }));
    expect(screen.getByRole('button', { name: 'post' })).toBeInTheDocument();
  });

  it('has nothing to delete', async () => {
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.click(screen.getByRole('tab', { name: 'Options' }));
    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
  });

  it('posts the css and js written alongside the body', async () => {
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.click(screen.getByRole('tab', { name: 'HTML' }));
    await user.click(await screen.findByRole('textbox', { name: 'html' }));
    // The html mode closes tags for you, so `</p>` is not typed here.
    await user.keyboard('<p>hello');

    await user.click(screen.getByRole('tab', { name: 'CSS' }));
    await user.click(await screen.findByRole('textbox', { name: 'css' }));
    // user-event reads `{` as the start of a key descriptor; `{{` is a literal one.
    await user.keyboard('p{{color:red}');

    await user.click(screen.getByRole('tab', { name: 'JS' }));
    await user.click(await screen.findByRole('textbox', { name: 'js' }));
    await user.keyboard('console.info(1)');

    await user.click(screen.getByRole('button', { name: 'post' }));

    await waitFor(() => expect(rpc.post).toHaveBeenCalled());
    expect(postedPayload()).toMatchObject({
      view: '<p>hello</p>',
      style: 'p{color:red}',
      code: 'console.info(1)',
    });
  });

  it('sends a blank slug when none was typed, so the server makes one', async () => {
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.click(screen.getByRole('button', { name: 'post' }));

    await waitFor(() => expect(rpc.post).toHaveBeenCalled());
    expect(postedPayload().name).toBe('');
  });

  it('takes the section, album and hidden state from where you file it', async () => {
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    // The album is marked hidden in the sitemap, so the post should be too.
    await user.selectOptions(albumSelect(), 'drafts');
    await user.click(screen.getByRole('button', { name: 'post' }));

    await waitFor(() => expect(rpc.post).toHaveBeenCalled());
    expect(postedPayload()).toMatchObject({ section: 'writing', album: 'drafts', hidden: true });
  });

  it('keeps where you are filing it in sight on every tab', async () => {
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.selectOptions(sectionSelect(), 'main');
    await user.click(screen.getByRole('tab', { name: 'CSS' }));

    expect(sectionSelect()).toHaveValue('main');
  });

  it('opens on the first section, and offers no album once you leave for main', async () => {
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    expect(sectionSelect()).toHaveValue('writing');
    expect(albumSelect()).toBeEnabled();

    // Nothing sits directly under main except top-level pages.
    await user.selectOptions(sectionSelect(), 'main');
    expect(albumSelect()).toBeDisabled();
  });

  it('makes a new section from the picker and files the post into it', async () => {
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.selectOptions(sectionSelect(), '__new__');
    await user.type(screen.getByPlaceholderText('section name'), 'travel');
    await user.click(screen.getByRole('button', { name: 'create' }));

    await waitFor(() => expect(rpc.container).toHaveBeenCalled());
    expect(rpc.container.mock.calls.at(-1)![0].json).toEqual({ kind: 'section', title: 'travel' });

    // The new section is pickable and picked, without waiting for a refetch.
    await waitFor(() => expect(sectionSelect()).toHaveValue('travel'));
    await user.click(screen.getByRole('button', { name: 'post' }));
    await waitFor(() => expect(rpc.post).toHaveBeenCalled());
    expect(postedPayload()).toMatchObject({ section: 'travel', album: '' });
  });

  it('makes a new album inside the section already chosen', async () => {
    const created = { section: 'writing', album: 'main', name: 'essays', title: 'essays', hidden: false };
    rpc.container.mockImplementation(async () => {
      rpc.sitemap.mockResolvedValue({ ok: true, json: async () => [...SITEMAP, { ...created, username: 'alice' }] });
      return { ok: true, json: async () => created };
    });
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.selectOptions(albumSelect(), '__new__');
    await user.type(screen.getByPlaceholderText('album name'), 'essays');
    await user.click(screen.getByRole('button', { name: 'create' }));

    await waitFor(() => expect(rpc.container).toHaveBeenCalled());
    expect(rpc.container.mock.calls.at(-1)![0].json).toEqual({
      kind: 'album',
      title: 'essays',
      section: 'writing',
    });
    await waitFor(() => expect(albumSelect()).toHaveValue('essays'));
  });

  it('hides a post filed into an album it just made inside a hidden section', async () => {
    // The album comes back hidden, and the sitemap it has to be looked up in is
    // a render behind — so the answer has to come from the response itself.
    const created = { section: 'writing', album: 'main', name: 'secret', title: 'secret', hidden: true };
    rpc.container.mockResolvedValue({ ok: true, json: async () => created });
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.selectOptions(albumSelect(), '__new__');
    await user.type(screen.getByPlaceholderText('album name'), 'secret');
    await user.click(screen.getByRole('button', { name: 'create' }));

    await waitFor(() => expect(rpc.container).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'post' }));

    await waitFor(() => expect(rpc.post).toHaveBeenCalled());
    expect(postedPayload()).toMatchObject({ section: 'writing', album: 'secret', hidden: true });
  });

  it('makes nothing when the dialog is cancelled', async () => {
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.selectOptions(sectionSelect(), '__new__');
    await user.click(screen.getByRole('button', { name: 'cancel' }));

    expect(rpc.container).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    // The picker is back where it was, not stuck on the option that opened it.
    expect(sectionSelect()).toHaveValue('writing');
  });

  it('stays open and says so when the new name is taken', async () => {
    rpc.container.mockResolvedValue({ ok: false, json: async () => ({ error: 'duplicate-name' }) });
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.selectOptions(sectionSelect(), '__new__');
    await user.type(screen.getByPlaceholderText('section name'), 'writing');
    await user.click(screen.getByRole('button', { name: 'create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something else already has that name.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('says what went wrong when the slug is taken, and keeps what you wrote', async () => {
    rpc.post.mockResolvedValue({ ok: false, json: async () => ({ error: 'duplicate-name' }) });
    const user = userEvent.setup();
    renderComposer();
    await openComposer();

    await user.click(screen.getByRole('tab', { name: 'HTML' }));
    await user.click(await screen.findByRole('textbox', { name: 'html' }));
    await user.keyboard('<p>keep me');
    await user.click(screen.getByRole('button', { name: 'post' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something else already has that name.');
    expect(screen.getByRole('textbox', { name: 'html' })).toHaveTextContent('<p>keep me</p>');
  });
});

// The picker reads a flat sitemap — a section, then its albums, then the next
// section — so a row dropped in the wrong place would list under the wrong one.
describe('slotting a new container into the sitemap already loaded', () => {
  const item = (section: string, album: string, name: string) => ({ username: 'alice', section, album, name });
  const flat = [
    item('main', '', 'writing'),
    item('writing', 'main', 'drafts'),
    item('main', '', 'photos'),
    item('photos', 'main', 'rome'),
  ];

  it('puts a new section at the end, where the server orders it', () => {
    const created = { section: 'main', album: '', name: 'travel', title: 'travel', hidden: false };

    expect(withCreated(flat, created).map((entry) => entry.name)).toEqual([
      'writing',
      'drafts',
      'photos',
      'rome',
      'travel',
    ]);
  });

  it('puts a new album after the ones its section already has', () => {
    const created = { section: 'writing', album: 'main', name: 'essays', title: 'essays', hidden: false };

    expect(withCreated(flat, created).map((entry) => entry.name)).toEqual([
      'writing',
      'drafts',
      'essays',
      'photos',
      'rome',
    ]);
  });

  it('puts the first album of a section right after the section itself', () => {
    const created = { section: 'photos', album: 'main', name: 'paris', title: 'paris', hidden: false };
    const noAlbums = [item('main', '', 'photos'), item('main', '', 'writing'), item('writing', 'main', 'drafts')];

    expect(withCreated(noAlbums, created).map((entry) => entry.name)).toEqual(['photos', 'paris', 'writing', 'drafts']);
  });
});
