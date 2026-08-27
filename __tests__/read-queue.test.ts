import { beforeEach, describe, expect, it, vi } from 'vitest';

// Reads are queued per item but must reach the server as one request per flush
// window: hitting the bottom of the feed marks every remaining item read at
// once, and one POST per item saturates the pooled connection.

type Call = { read: boolean; items: { fromUsername: string; postId: string }[]; keepalive?: boolean };
const calls: Call[] = [];
let failNext = false;

vi.mock('lib/rpc', () => ({
  rpc: {
    api: {
      'content-remote': {
        'read-batch': {
          $post: async ({ json }: { json: Call }, options?: { init?: RequestInit }) => {
            calls.push({ read: json.read, items: json.items, keepalive: options?.init?.keepalive });
            return { ok: !failNext, json: async () => ({ count: json.items.length, read: json.read }) };
          },
        },
      },
    },
  },
}));

const { queueRead, flushReadQueueNow } = await import('lib/read-queue');

beforeEach(() => {
  calls.length = 0;
  failNext = false;
});

describe('read queue', () => {
  it('coalesces a burst of reads into a single request', async () => {
    const settled = Array.from({ length: 20 }, (_, i) => queueRead('https://example.com', `p${i}`, true));
    await flushReadQueueNow();
    await expect(Promise.all(settled)).resolves.toHaveLength(20);

    expect(calls).toHaveLength(1);
    expect(calls[0].read).toBe(true);
    expect(calls[0].items).toHaveLength(20);
  });

  it('carries items from several feeds in one request', async () => {
    queueRead('https://a.example', 'p1', true);
    queueRead('https://b.example', 'p2', true);
    await flushReadQueueNow();

    expect(calls).toHaveLength(1);
    expect(calls[0].items).toEqual([
      { fromUsername: 'https://a.example', postId: 'p1' },
      { fromUsername: 'https://b.example', postId: 'p2' },
    ]);
  });

  it('splits reads and un-reads into separate requests', async () => {
    queueRead('https://example.com', 'p1', true);
    queueRead('https://example.com', 'p2', false);
    await flushReadQueueNow();

    expect(calls).toHaveLength(2);
    expect(calls.find((c) => c.read)!.items).toEqual([{ fromUsername: 'https://example.com', postId: 'p1' }]);
    expect(calls.find((c) => !c.read)!.items).toEqual([{ fromUsername: 'https://example.com', postId: 'p2' }]);
  });

  // "keep unread" clicked right after the item scrolled past: the later intent
  // must win, and must not race the mark-as-read it supersedes.
  it('supersedes an earlier intent for the same item', async () => {
    const first = queueRead('https://example.com', 'p1', true);
    const second = queueRead('https://example.com', 'p1', false);
    await flushReadQueueNow();

    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
    expect(calls).toHaveLength(1);
    expect(calls[0].read).toBe(false);
    expect(calls[0].items).toEqual([{ fromUsername: 'https://example.com', postId: 'p1' }]);
  });

  it('rejects every item in a failed batch so each can roll back', async () => {
    failNext = true;
    const settled = [queueRead('https://example.com', 'p1', true), queueRead('https://example.com', 'p2', true)];
    await flushReadQueueNow();

    await expect(settled[0]).rejects.toThrow('read-batch failed');
    await expect(settled[1]).rejects.toThrow('read-batch failed');
  });

  it('chunks a queue larger than the per-request cap', async () => {
    const settled = Array.from({ length: 250 }, (_, i) => queueRead('https://example.com', `p${i}`, true));
    await flushReadQueueNow();
    await expect(Promise.all(settled)).resolves.toHaveLength(250);

    expect(calls).toHaveLength(2);
    expect(calls[0].items).toHaveLength(200);
    expect(calls[1].items).toHaveLength(50);
  });

  it('flushes on its own timer without an explicit flush', async () => {
    vi.useFakeTimers();
    try {
      queueRead('https://example.com', 'p1', true);
      expect(calls).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(300);
      expect(calls).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('flushes queued reads with keepalive when the page goes away', async () => {
    queueRead('https://example.com', 'p1', true);
    window.dispatchEvent(new Event('pagehide'));
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].keepalive).toBe(true);
    expect(calls[0].items).toEqual([{ fromUsername: 'https://example.com', postId: 'p1' }]);
  });

  it('does not use keepalive for an ordinary flush', async () => {
    queueRead('https://example.com', 'p1', true);
    await flushReadQueueNow();
    expect(calls[0].keepalive).toBeUndefined();
  });

  it('starts a fresh window after a flush', async () => {
    queueRead('https://example.com', 'p1', true);
    await flushReadQueueNow();
    queueRead('https://example.com', 'p2', true);
    await flushReadQueueNow();

    expect(calls).toHaveLength(2);
    expect(calls[1].items).toEqual([{ fromUsername: 'https://example.com', postId: 'p2' }]);
  });
});
