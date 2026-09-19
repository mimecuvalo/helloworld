import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'i18n';
import { EditorProvider } from 'lib/editor-context';
import { UserProvider } from 'lib/user-context';

// Saving happens with the editor already closed, so for as long as the request
// is in flight the page has nothing to render but the row it loaded before the
// edit. These cover the two halves of that moment: the button that ends the
// session says what it does, and the page shows the new words rather than
// briefly reverting to the old ones.

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
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => router,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

import ContentEditor from 'components/content/ContentEditor';
import Header from 'components/content/Header';
import Simple from 'components/content/templates/Simple';

const ROW = {
  section: 'writing',
  album: '',
  name: 'second-post',
  title: 'Second Post',
  template: '',
  thumb: '',
  hidden: false,
  style: '',
  code: '',
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

// The page as the owner sees it: the title with its edit toggle, the editor,
// and the body underneath that the editor is standing in front of.
function renderPage(content = CONTENT) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <IntlProvider defaultLocale="en" locale="en" messages={{}}>
      <QueryClientProvider client={client}>
        <UserProvider user={{ username: 'alice' }}>
          <EditorProvider>
            <Header content={content} />
            <ContentEditor content={content} />
            <Simple content={content} />
          </EditorProvider>
        </UserProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
}

const toggle = () => screen.getByRole('button', { name: /^(edit|save)$/ });

async function startEditing(user: ReturnType<typeof userEvent.setup>) {
  await user.click(toggle());
  await screen.findByRole('tabpanel');
}

async function typeIntoHtml(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole('tab', { name: 'HTML' }));
  const html = await screen.findByRole('textbox', { name: 'html' });
  await user.click(html);
  await user.keyboard(text);
  return html;
}

// A save that is left hanging until the test says otherwise.
function heldSave() {
  let finish: (value: { ok: boolean; json: () => Promise<unknown> }) => void = () => {};
  rpc.save.mockReturnValue(new Promise((resolve) => (finish = resolve)));
  return (body: unknown = { ...CONTENT }) => finish({ ok: true, json: async () => body });
}

const body = () => document.querySelector('.hw-view');
const headerTitle = () => document.querySelector('.p-name');

beforeAll(() => {
  // ProseMirror and CodeMirror both measure; jsdom has no layout.
  const emptyRect = { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } as DOMRect;
  Range.prototype.getClientRects = () => Object.assign([], { item: () => null });
  Range.prototype.getBoundingClientRect = () => emptyRect;
});

beforeEach(() => {
  vi.clearAllMocks();
  rpc.editable.mockResolvedValue({ ok: true, json: async () => ROW });
  rpc.sitemap.mockResolvedValue({ ok: true, json: async () => [] });
  rpc.save.mockResolvedValue({ ok: true, json: async () => ({ ...CONTENT }) });
  router.invalidate.mockResolvedValue(undefined);
  router.navigate.mockResolvedValue(undefined);
});

describe('the edit toggle', () => {
  it('offers to save while the editor is open', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(toggle()).toHaveTextContent('edit');

    await startEditing(user);
    expect(toggle()).toHaveTextContent('save');

    await user.click(toggle());
    await waitFor(() => expect(toggle()).toHaveTextContent('edit'));
  });
});

describe('the page while a save is in flight', () => {
  it('shows what was just written, not the copy the page was loaded with', async () => {
    const finishSave = heldSave();

    const user = userEvent.setup();
    renderPage();
    await startEditing(user);
    await typeIntoHtml(user, '<p>a second thought</p>');

    await user.click(toggle());

    await waitFor(() => expect(body()).toHaveTextContent('a second thought'));

    finishSave();

    // Once the router has the saved row it is the page's copy that renders
    // again — here, still the one the test handed it, without the new line.
    await waitFor(() => expect(router.invalidate).toHaveBeenCalled());
    await waitFor(() => expect(body()).not.toHaveTextContent('a second thought'));
    expect(body()).toHaveTextContent('hello');
  });

  it('shows the title the body was just given', async () => {
    const finishSave = heldSave();

    const user = userEvent.setup();
    renderPage({ ...CONTENT, title: '' });
    await startEditing(user);
    await typeIntoHtml(user, '<h1>Renamed By Its Heading</h1>');

    await user.click(toggle());

    await waitFor(() => expect(headerTitle()).toHaveTextContent('Renamed By Its Heading'));

    finishSave({ ...CONTENT, title: 'Renamed By Its Heading' });
    await waitFor(() => expect(router.invalidate).toHaveBeenCalled());
  });

  it('drops back to the page as it was when the save fails', async () => {
    rpc.save.mockResolvedValue({ ok: false, json: async () => ({ error: 'duplicate-name' }) });

    const user = userEvent.setup();
    renderPage();
    await startEditing(user);
    await typeIntoHtml(user, '<p>a second thought</p>');

    await user.click(toggle());

    // The editor reopens on the unsaved draft, so the body it was covering is
    // not on screen at all — what must not happen is it being left claiming the
    // page has words the server refused.
    expect(await screen.findByRole('alert')).toHaveTextContent('Something else already has that name.');
    expect(body()).toBeNull();
  });
});

describe('reopening the editor before the save has landed', () => {
  it('opens on what was just typed, and keeps it when the save lands', async () => {
    const finishSave = heldSave();

    const user = userEvent.setup();
    renderPage();
    await startEditing(user);
    await typeIntoHtml(user, '<p>a second thought</p>');
    await user.click(toggle());
    await waitFor(() => expect(body()).toHaveTextContent('a second thought'));

    // Straight back in, while the request is still out.
    await user.click(toggle());
    const html = await typeIntoHtml(user, '<p>and a third</p>');
    expect(html).toHaveTextContent('a second thought');

    finishSave();
    await waitFor(() => expect(router.invalidate).toHaveBeenCalled());

    // The save finishing must not pull the row out from under an editor that is
    // open again: what it is showing is ahead of what was saved.
    expect(screen.getByRole('textbox', { name: 'html' })).toHaveTextContent('and a third');
    expect(screen.getByRole('textbox', { name: 'html' })).toHaveTextContent('a second thought');
  });

  it('saves the second round of edits when it is closed again', async () => {
    const finishSave = heldSave();

    const user = userEvent.setup();
    renderPage();
    await startEditing(user);
    await typeIntoHtml(user, '<p>a second thought</p>');
    await user.click(toggle());

    await user.click(toggle());
    await typeIntoHtml(user, '<p>and a third</p>');

    finishSave();
    await waitFor(() => expect(rpc.save).toHaveBeenCalledTimes(1));

    rpc.save.mockResolvedValue({ ok: true, json: async () => ({ ...CONTENT }) });
    await user.click(toggle());

    await waitFor(() => expect(rpc.save).toHaveBeenCalledTimes(2));
    const view = rpc.save.mock.calls.at(-1)![0].json.view;
    expect(view).toContain('and a third');
    expect(view).toContain('a second thought');
  });

  it('leaves the page showing the newer save when two are in flight', async () => {
    const finishFirst = heldSave();

    const user = userEvent.setup();
    renderPage();
    await startEditing(user);
    await typeIntoHtml(user, '<p>a second thought</p>');
    await user.click(toggle());

    await user.click(toggle());
    await typeIntoHtml(user, '<p>and a third</p>');
    const finishSecond = heldSave();
    await user.click(toggle());
    await waitFor(() => expect(body()).toHaveTextContent('and a third'));

    // The first save lands last. It is stale by now, so it neither clears the
    // newer save's copy off the page nor puts its own back.
    finishFirst();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(body()).toHaveTextContent('and a third');

    finishSecond();
    await waitFor(() => expect(body()).not.toHaveTextContent('and a third'));
  });
});
