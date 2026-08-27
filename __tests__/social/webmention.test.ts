import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  getLocalContent: vi.fn(),
  getRemoteContent: vi.fn(),
  getRemoteUser: vi.fn(),
  saveRemoteContent: vi.fn(),
  saveRemoteUser: vi.fn(),
}));
const discover = vi.hoisted(() => ({ getUserRemoteInfo: vi.fn() }));

vi.mock('server/social/db', () => db);
vi.mock('server/social/discover-user', () => discover);

import { handleMention } from 'server/social/webmention';
import { HOST, content, contentRemote, user, userRemote } from './fixtures';

const SOURCE = 'https://remote.example/bob/note-1';
const TARGET = `https://${HOST}/alice/blog/hello`;

const H_ENTRY = `<html><body><article class="h-entry">
  <h1 class="p-name">Re: Hello</h1>
  <time class="t-published" datetime="2026-05-01T10:00:00.000Z"></time>
  <time class="t-updated" datetime="2026-05-02T10:00:00.000Z"></time>
  <div class="e-content"><p>good post</p><script>alert(1)</script></div>
</article></body></html>`;

let fetchMock: ReturnType<typeof vi.fn>;

function serveSource(html: string, status = 200) {
  fetchMock.mockResolvedValue(new Response(html, { status, headers: { 'content-type': 'text/html' } }));
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  discover.getUserRemoteInfo.mockResolvedValue(userRemote({ id: -1 }));
  db.getRemoteUser.mockResolvedValue(userRemote({ id: 5 }));
  db.getRemoteContent.mockResolvedValue(null);
  db.getLocalContent.mockResolvedValue(content({ name: 'hello' }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('handleMention', () => {
  it('stores a microformats reply as a comment on the local item', async () => {
    serveSource(H_ENTRY);

    await handleMention(user(), SOURCE, TARGET);

    const saved = db.saveRemoteContent.mock.calls[0][0];
    expect(saved).toMatchObject({
      type: 'comment',
      toUsername: 'alice',
      localContentName: 'hello',
      fromUsername: 'https://remote.example/bob',
      fromUserRemoteId: '5',
      creator: 'Bob B',
      username: 'bob',
      link: SOURCE,
      postId: SOURCE,
      title: 'Re: Hello',
    });
    expect(saved.createdAt).toEqual(new Date('2026-05-01T10:00:00.000Z'));
    expect(saved.updatedAt).toEqual(new Date('2026-05-02T10:00:00.000Z'));
  });

  it('sanitizes the remote e-content before storing it', async () => {
    serveSource(H_ENTRY);

    await handleMention(user(), SOURCE, TARGET);

    expect(db.saveRemoteContent.mock.calls[0][0].view).toBe('<p>good post</p>');
  });

  it('ignores a source page with no h-entry', async () => {
    serveSource('<html><body><p>just a link to you</p></body></html>');

    await handleMention(user(), SOURCE, TARGET);

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
    expect(discover.getUserRemoteInfo).not.toHaveBeenCalled();
  });

  it('discovers and saves an unknown sender before storing the mention', async () => {
    serveSource(H_ENTRY);
    const discovered = userRemote({ id: -1 });
    discover.getUserRemoteInfo.mockResolvedValue(discovered);
    db.getRemoteUser.mockResolvedValueOnce(null).mockResolvedValueOnce(userRemote({ id: 5 }));

    await handleMention(user(), SOURCE, TARGET);

    expect(discover.getUserRemoteInfo).toHaveBeenCalledWith(SOURCE, 'alice');
    expect(db.saveRemoteUser).toHaveBeenCalledWith(discovered);
    expect(db.saveRemoteContent).toHaveBeenCalled();
  });

  it('does not re-save a sender we already know', async () => {
    serveSource(H_ENTRY);

    await handleMention(user(), SOURCE, TARGET);

    expect(db.saveRemoteUser).not.toHaveBeenCalled();
  });

  it('throws when the sender can neither be found nor saved', async () => {
    serveSource(H_ENTRY);
    db.getRemoteUser.mockResolvedValue(null);

    await expect(handleMention(user(), SOURCE, TARGET)).rejects.toThrow('user not found.');
    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('updates the existing row when the same source mentions us again', async () => {
    serveSource(H_ENTRY);
    db.getRemoteContent.mockResolvedValue(contentRemote({ id: 31 }));

    await handleMention(user(), SOURCE, TARGET);

    expect(db.getRemoteContent).toHaveBeenCalledWith('alice', SOURCE);
    expect(db.saveRemoteContent.mock.calls[0][0].id).toBe(31);
  });

  it('marks a first-time mention with the sentinel id so it autoincrements', async () => {
    serveSource(H_ENTRY);

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
    await handleMention(user(), SOURCE, TARGET);

    expect(db.saveRemoteContent.mock.calls[0][0].id).toBe(-1);
  });

  it('falls back to the p-summary when the entry has no p-name', async () => {
    serveSource(H_ENTRY.replace('<h1 class="p-name">Re: Hello</h1>', '<p class="p-summary">A summary</p>'));

    await handleMention(user(), SOURCE, TARGET);

    expect(db.saveRemoteContent.mock.calls[0][0].title).toBe('A summary');
  });

  it('stores the mention without a local item when the target is unknown', async () => {
    serveSource(H_ENTRY);
    db.getLocalContent.mockResolvedValue(null);

    await handleMention(user(), SOURCE, TARGET);

    expect(db.saveRemoteContent.mock.calls[0][0].localContentName).toBeUndefined();
  });

  it('propagates a fetch failure on the source url', async () => {
    fetchMock.mockResolvedValue(new Response('gone', { status: 410 }));

    await expect(handleMention(user(), SOURCE, TARGET)).rejects.toThrow();
    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });
});
