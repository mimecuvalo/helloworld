import { beforeEach, describe, expect, it, vi } from 'vitest';

const social = vi.hoisted(() => ({
  syndicate: vi.fn(),
  threadUserFor: vi.fn(),
  unsyndicate: vi.fn(),
}));

vi.mock('server/social', () => social);

import type { Context } from 'server/context';
import { postContent, saveContent } from 'server/services/content';

// content.threadUser is what decides who a reply is delivered and addressed to,
// and what the Atom rendering reads for ostatus:attention. It sat unwritten in
// the schema for years, so the wiring that fills it is worth pinning down.

const REPLY_HTML = '<p>replying to <a class="u-in-reply-to" href="https://remote.example/bob/1">that</a></p>';

let created: { data: Record<string, unknown> } | undefined;
let updated: { data: Record<string, unknown> } | undefined;

function context(): Context {
  return {
    currentUsername: 'alice',
    currentUser: null,
    hostname: 'example.com',
    prisma: {
      $transaction: <T>(fn: (tx: unknown) => Promise<T>) => fn(context().prisma),
      content: {
        // saveContent reads the row first: renames and moves are decided against
        // where it currently sits. postContent asks the same question about the
        // slug it was handed, and has to hear that nothing holds it.
        findUnique: vi.fn(async ({ where }: { where: { username_name?: { name: string } } }) =>
          where.username_name?.name === 'reply'
            ? {
                id: 1,
                username: 'alice',
                section: 'comments',
                album: 'main',
                name: 'reply',
                hidden: false,
                createdAt: new Date(0),
              }
            : null
        ),
        create: vi.fn(async (args) => {
          created = args;
          return { ...args.data, id: 1 };
        }),
        update: vi.fn(async (args) => {
          updated = args;
          return { ...args.data, id: 1 };
        }),
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
    },
  } as unknown as Context;
}

const post = (view: string) =>
  postContent(context(), {
    section: 'comments',
    album: 'main',
    name: 'new-reply',
    title: '',
    hidden: false,
    thumb: '',
    style: '',
    code: '',
    view,
  });

beforeEach(() => {
  vi.clearAllMocks();
  created = undefined;
  updated = undefined;
  social.threadUserFor.mockResolvedValue(null);
});

describe('postContent', () => {
  it('resolves and stores the author of the post being replied to', async () => {
    social.threadUserFor.mockResolvedValue('https://remote.example/bob');

    await post(REPLY_HTML);

    expect(social.threadUserFor).toHaveBeenCalledWith(expect.anything(), 'https://remote.example/bob/1');
    expect(created?.data).toMatchObject({
      thread: 'https://remote.example/bob/1',
      threadUser: 'https://remote.example/bob',
    });
  });

  it('stores a null threadUser for a post that is not a reply', async () => {
    await post('<p>just a post</p>');

    expect(created?.data).toMatchObject({ thread: undefined, threadUser: null });
  });

  it('still posts when the author cannot be worked out', async () => {
    social.threadUserFor.mockResolvedValue(null);

    await post(REPLY_HTML);

    expect(created?.data).toMatchObject({ thread: 'https://remote.example/bob/1', threadUser: null });
  });
});

describe('saveContent', () => {
  it('re-resolves the author when an edit changes what the post replies to', async () => {
    social.threadUserFor.mockResolvedValue('https://remote.example/bob');

    await saveContent(context(), { name: 'reply', title: '', hidden: false, view: REPLY_HTML });

    expect(updated?.data).toMatchObject({
      thread: 'https://remote.example/bob/1',
      threadUser: 'https://remote.example/bob',
    });
  });

  it('clears it when an edit removes the reply anchor', async () => {
    await saveContent(context(), { name: 'reply', title: '', hidden: false, view: '<p>never mind</p>' });

    expect(updated?.data).toMatchObject({ threadUser: null });
  });
});
