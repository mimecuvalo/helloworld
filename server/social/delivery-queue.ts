import type { Delivery } from '../../generated/prisma/client';
import prisma from '../prisma';

// Retry bookkeeping for outbound deliveries.
//
// An inbox being down for ten minutes used to mean the post never arrived: the
// fetch failure was caught and discarded, and nothing remembered that there had
// been anything to send. Every activity that fails its immediate attempt now
// leaves a row here, and the cron works through them.
//
// Only the bookkeeping lives in this file. The actual send is in
// activitystreams, which imports this — keeping the dependency one-way.

// Ten attempts on the schedule below spans a bit over a day, which is long
// enough to ride out a reboot or a certificate renewal and short enough that a
// genuinely dead inbox stops costing anything by tomorrow.
export const MAX_ATTEMPTS = 10;
const BASE_DELAY_MS = 60 * 1000;
const MAX_DELAY_MS = 6 * 60 * 60 * 1000;

// Retrying these is pointless: the peer understood the request and refused it.
// 408 and 429 are the 4xx exceptions — both explicitly mean "later".
export function isPermanentFailure(status: number): boolean {
  if (status === 408 || status === 429) return false;
  return status >= 400 && status < 500;
}

// 410 Gone is the peer stating the account no longer exists — the one status
// that justifies dropping a follower on its own. Deliberately not 404, which is
// just as often a misconfigured route or a reverse proxy having a bad day, and
// which would otherwise silently empty the follower list.
export function isGone(status: number): boolean {
  return status === 410;
}

// Exponential, with jitter so that a hundred deliveries queued by one failed
// fan-out don't all wake up and hit the same instance in the same second.
export function backoffMs(attempts: number): number {
  const base = Math.min(BASE_DELAY_MS * Math.pow(2, attempts), MAX_DELAY_MS);
  return Math.round(base * (0.75 + Math.random() * 0.5));
}

export type QueuedDelivery = {
  username: string;
  inboxUrl: string;
  activityId: string;
  message: string;
};

// Idempotent on (inboxUrl, activityId): the inline attempt and a retry of the
// same activity must never both land, and a re-run of the cron must not fan a
// row out twice.
export async function enqueueDelivery(delivery: QueuedDelivery): Promise<void> {
  const nextAttemptAt = new Date(Date.now() + backoffMs(0));
  try {
    await prisma.delivery.upsert({
      where: { inboxUrl_activityId: { inboxUrl: delivery.inboxUrl, activityId: delivery.activityId } },
      update: {},
      create: { ...delivery, attempts: 1, nextAttemptAt },
    });
  } catch (ex) {
    // Failing to *record* a failed delivery is not worth failing the request
    // the user is waiting on.
    console.error(`could not queue delivery to ${delivery.inboxUrl}: ${(ex as Error)?.message || ex}`);
  }
}

export async function dueDeliveries(limit: number): Promise<Delivery[]> {
  return await prisma.delivery.findMany({
    where: { nextAttemptAt: { lte: new Date() }, attempts: { lt: MAX_ATTEMPTS } },
    orderBy: [{ nextAttemptAt: 'asc' }],
    take: limit,
  });
}

export async function rescheduleDelivery(delivery: Delivery, error: string): Promise<void> {
  await prisma.delivery.update({
    where: { id: delivery.id },
    data: {
      attempts: delivery.attempts + 1,
      nextAttemptAt: new Date(Date.now() + backoffMs(delivery.attempts + 1)),
      lastError: error.slice(0, 500),
    },
  });
}

export async function dropDelivery(id: number): Promise<void> {
  await prisma.delivery.delete({ where: { id } }).catch(() => {
    // Already gone — another run got there first.
  });
}

// Rows that have run out of attempts. Kept until now so the cron's summary can
// mention them, then cleared so the table doesn't grow forever.
export async function pruneExhaustedDeliveries(): Promise<number> {
  const { count } = await prisma.delivery.deleteMany({ where: { attempts: { gte: MAX_ATTEMPTS } } });
  return count;
}

// The peer at this inbox is gone. Stop treating them as a follower so the next
// post doesn't queue a delivery to the same dead address all over again.
export async function retireInbox(inboxUrl: string): Promise<void> {
  await prisma.userRemote.updateMany({
    where: { OR: [{ activityPubInboxUrl: inboxUrl }, { sharedInboxUrl: inboxUrl }], follower: true },
    data: { follower: false },
  });
  await prisma.delivery.deleteMany({ where: { inboxUrl } });
}
