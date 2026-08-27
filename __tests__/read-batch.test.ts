import { describe, expect, it, vi } from 'vitest';
import type { Context } from 'server/context';

vi.mock('server/prisma', () => ({ default: {} }));
vi.mock('server/social', () => ({ syndicate: vi.fn(), like: vi.fn(), reblog: vi.fn() }));

const { readContentRemoteBatch, READ_BATCH_MAX } = await import('server/services/content-remote');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function context(updateMany: any): Context {
  return { currentUsername: 'alice', prisma: { contentRemote: { updateMany } } } as unknown as Context;
}

describe('readContentRemoteBatch', () => {
  it('marks a whole batch read in one updateMany scoped to the current user', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const result = await readContentRemoteBatch(context(updateMany), {
      read: true,
      items: [
        { fromUsername: 'https://a.example', postId: 'p1' },
        { fromUsername: 'https://b.example', postId: 'p2' },
      ],
    });

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      data: { read: true },
      where: {
        toUsername: 'alice',
        OR: [
          { fromUsername: 'https://a.example', postId: 'p1' },
          { fromUsername: 'https://b.example', postId: 'p2' },
        ],
      },
    });
    expect(result).toEqual({ count: 2, read: true });
  });

  // Never widen past the owner: a postId is only unique within (toUsername, fromUsername).
  it('does not match rows belonging to another user', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    await readContentRemoteBatch(context(updateMany), {
      read: false,
      items: [{ fromUsername: 'https://a.example', postId: 'p1' }],
    });
    expect(updateMany.mock.calls[0][0].where.toUsername).toBe('alice');
  });

  it('carries the unread direction through', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const result = await readContentRemoteBatch(context(updateMany), {
      read: false,
      items: [{ fromUsername: 'https://a.example', postId: 'p1' }],
    });
    expect(updateMany.mock.calls[0][0].data).toEqual({ read: false });
    expect(result.read).toBe(false);
  });

  it('short-circuits an empty batch without touching the db', async () => {
    const updateMany = vi.fn();
    const result = await readContentRemoteBatch(context(updateMany), { read: true, items: [] });
    expect(updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ count: 0, read: true });
  });

  it('caps at the size the client chunks to', () => {
    expect(READ_BATCH_MAX).toBe(200);
  });
});
