import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  delivery: {
    upsert: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  userRemote: { updateMany: vi.fn() },
}));
vi.mock('server/prisma', () => ({ default: prisma }));

import {
  backoffMs,
  dropDelivery,
  dueDeliveries,
  enqueueDelivery,
  isGone,
  isPermanentFailure,
  MAX_ATTEMPTS,
  pruneExhaustedDeliveries,
  rescheduleDelivery,
  retireInbox,
} from 'server/social/delivery-queue';
import type { Delivery } from '../../generated/prisma/client';

// The queue is what turns "the inbox was down for ten minutes" from a lost post
// into a retried one.

const INBOX = 'https://remote.example/users/bob/inbox';

const queued = () => ({
  username: 'alice',
  inboxUrl: INBOX,
  activityId: 'https://example.com/ap/alice/a/abc',
  message: '{"type":"Create"}',
});

const row = (overrides: Partial<Delivery> = {}) => ({ id: 1, attempts: 1, inboxUrl: INBOX, ...overrides }) as Delivery;

beforeEach(() => {
  vi.clearAllMocks();
  prisma.delivery.deleteMany.mockResolvedValue({ count: 0 });
});

describe('failure classification', () => {
  it.each([400, 401, 403, 404, 410, 422])('treats %i as permanent — the peer understood and refused', (status) => {
    expect(isPermanentFailure(status)).toBe(true);
  });

  // Both explicitly mean "later", which is the whole point of a queue.
  it.each([408, 429])('keeps retrying a %i', (status) => {
    expect(isPermanentFailure(status)).toBe(false);
  });

  it.each([500, 502, 503, 504])('keeps retrying a %i', (status) => {
    expect(isPermanentFailure(status)).toBe(false);
  });

  // Status 0 is our own marker for a request that never completed — DNS, TLS,
  // a timeout — which is the most retryable failure there is.
  it('keeps retrying a transport failure', () => {
    expect(isPermanentFailure(0)).toBe(false);
  });

  it('only counts 410 as gone, since a 404 is as often a broken route', () => {
    expect(isGone(410)).toBe(true);
    expect(isGone(404)).toBe(false);
    expect(isGone(500)).toBe(false);
  });
});

describe('backoffMs', () => {
  it('grows with each attempt', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(backoffMs(1)).toBeLessThan(backoffMs(2));
    expect(backoffMs(2)).toBeLessThan(backoffMs(3));

    vi.restoreAllMocks();
  });

  it('caps, so attempt ten is not scheduled for next month', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(backoffMs(MAX_ATTEMPTS)).toBeLessThanOrEqual(6 * 60 * 60 * 1000);

    vi.restoreAllMocks();
  });

  // A fan-out that fails wholesale queues one row per follower; without jitter
  // they would all wake up and hit the same instance in the same second.
  it('jitters, so a failed fan-out does not retry in lockstep', () => {
    const delays = new Set(Array.from({ length: 20 }, () => backoffMs(3)));

    expect(delays.size).toBeGreaterThan(1);
  });
});

describe('enqueueDelivery', () => {
  it('records the attempt already spent, and schedules the next', async () => {
    await enqueueDelivery(queued());

    const args = prisma.delivery.upsert.mock.calls[0][0];
    expect(args.create).toMatchObject({ username: 'alice', inboxUrl: INBOX, attempts: 1 });
    expect(args.create.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });

  // The inline attempt and a retry of the same activity must never both land.
  it('is idempotent on (inbox, activity), leaving an existing row alone', async () => {
    await enqueueDelivery(queued());

    const args = prisma.delivery.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ inboxUrl_activityId: { inboxUrl: INBOX, activityId: queued().activityId } });
    expect(args.update).toEqual({});
  });

  // Failing to record a failed delivery is not worth failing the request the
  // person is waiting on.
  it('swallows a database error rather than failing the post', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    prisma.delivery.upsert.mockRejectedValue(new Error('down'));

    await expect(enqueueDelivery(queued())).resolves.toBeUndefined();
  });
});

describe('dueDeliveries', () => {
  it('asks only for rows that are due and still have attempts left', async () => {
    prisma.delivery.findMany.mockResolvedValue([]);

    await dueDeliveries(25);

    const args = prisma.delivery.findMany.mock.calls[0][0];
    expect(args.where.attempts).toEqual({ lt: MAX_ATTEMPTS });
    expect(args.where.nextAttemptAt.lte).toBeInstanceOf(Date);
    expect(args.take).toBe(25);
  });
});

describe('rescheduleDelivery', () => {
  it('counts the attempt and pushes the next one out', async () => {
    await rescheduleDelivery(row({ attempts: 2 }), '503 Service Unavailable');

    const data = prisma.delivery.update.mock.calls[0][0].data;
    expect(data.attempts).toBe(3);
    expect(data.lastError).toBe('503 Service Unavailable');
    expect(data.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('truncates a huge error, since this column is a breadcrumb not a log', async () => {
    await rescheduleDelivery(row(), 'x'.repeat(5000));

    expect(prisma.delivery.update.mock.calls[0][0].data.lastError).toHaveLength(500);
  });
});

describe('dropDelivery', () => {
  it('ignores a row another run already removed', async () => {
    prisma.delivery.delete.mockRejectedValue(new Error('not found'));

    await expect(dropDelivery(1)).resolves.toBeUndefined();
  });
});

describe('pruneExhaustedDeliveries', () => {
  it('clears rows that ran out of attempts, and says how many', async () => {
    prisma.delivery.deleteMany.mockResolvedValue({ count: 3 });

    await expect(pruneExhaustedDeliveries()).resolves.toBe(3);
    expect(prisma.delivery.deleteMany.mock.calls[0][0].where).toEqual({ attempts: { gte: MAX_ATTEMPTS } });
  });
});

describe('retireInbox', () => {
  // The dead-follower pruning that falls out of reading the status code.
  it('stops treating anyone at that inbox as a follower', async () => {
    await retireInbox(INBOX);

    const args = prisma.userRemote.updateMany.mock.calls[0][0];
    expect(args.where.OR).toEqual([{ activityPubInboxUrl: INBOX }, { sharedInboxUrl: INBOX }]);
    expect(args.where.follower).toBe(true);
    expect(args.data).toEqual({ follower: false });
  });

  it('clears anything still queued for it, which can never be delivered now', async () => {
    await retireInbox(INBOX);

    expect(prisma.delivery.deleteMany).toHaveBeenCalledWith({ where: { inboxUrl: INBOX } });
  });
});
