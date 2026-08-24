import { AtpAgent, RichText } from '@atproto/api';
import type { AtpSessionData, AtpSessionEvent } from '@atproto/api';
import type { Content, ContentRemote, User, UserRemote } from '../../generated/prisma/client';
import prisma from '../prisma';
import { PUBLIC_BSKY_PDS } from './atproto-identity';
import { POST_COLLECTION, bskyPermalink, buildPostRecord, renderPostText, rkeyFor, rkeyOfUri } from './atproto-records';
import { getRemoteContent, saveRemoteContent } from './db';
import { decryptSecret, encryptSecret } from '../secrets';

// The Bluesky bridge: the half of AT Protocol support that actually moves data.
//
// Outbound, a published post is mirrored to the user's linked Bluesky account
// as an app.bsky.feed.post. Inbound, a followed Bluesky account's posts are
// polled and stored as ContentRemote alongside Atom and ActivityPub items, so
// the reader treats all three the same.
//
// Auth is an app password, not OAuth: the user pastes one from Bluesky's
// settings and we hold the resulting refresh token.

const FEED_MAX_DAYS_OLD = 30 * 24 * 60 * 60 * 1000; // matches feeds.ts

export function hasBlueskyCredentials(user: Pick<User, 'atprotoHandle' | 'atprotoAppPassword'>): boolean {
  return !!(user.atprotoHandle && user.atprotoAppPassword);
}

// An agent authenticated as the local user. Resumes the stored session when it
// can — logging in on every publish would mint a new session each time — and
// writes refreshed tokens back so the next call can resume too.
export async function getAgent(user: User): Promise<AtpAgent | null> {
  if (!hasBlueskyCredentials(user)) return null;

  const agent = new AtpAgent({
    service: user.atprotoPdsUrl || PUBLIC_BSKY_PDS,
    persistSession: (_event: AtpSessionEvent, session?: AtpSessionData) => {
      if (!session) return;
      // Fire-and-forget: a failed token write costs one extra login later.
      prisma.user
        .update({
          where: { id: user.id },
          data: {
            atprotoRefreshJwt: encryptSecret(session.refreshJwt),
            atprotoDid: session.did,
            atprotoHandle: session.handle,
          },
        })
        .catch(() => {});
    },
  });

  if (user.atprotoRefreshJwt && user.atprotoDid) {
    try {
      await agent.resumeSession({
        did: user.atprotoDid,
        handle: user.atprotoHandle || '',
        refreshJwt: decryptSecret(user.atprotoRefreshJwt),
        // resumeSession refreshes when the access token is missing or stale.
        accessJwt: '',
        active: true,
      } as AtpSessionData);
      if (agent.session) return agent;
    } catch {
      // Stored session is dead; fall back to the app password.
    }
  }

  try {
    await agent.login({ identifier: user.atprotoHandle!, password: decryptSecret(user.atprotoAppPassword) });
    return agent;
  } catch (ex) {
    console.error(`${user.username}: bluesky login failed.\n${ex}`);
    return null;
  }
}

// Detects links, mentions and hashtags so they're live on Bluesky rather than
// plain text. Facet offsets are byte offsets, which RichText handles.
async function facetsFor(agent: AtpAgent, text: string) {
  const richText = new RichText({ text });
  await richText.detectFacets(agent);
  return richText.facets;
}

export async function publishToBluesky(host: string, contentOwner: User, content: Content): Promise<void> {
  if (content.hidden || !hasBlueskyCredentials(contentOwner)) return;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return;

  const record = buildPostRecord(host, content, contentOwner);
  record.facets = await facetsFor(agent, record.text as string);

  try {
    // putRecord rather than createRecord: the rkey is derived from the post, so
    // republishing an edit replaces the record instead of duplicating it.
    const response = await agent.com.atproto.repo.putRecord({
      repo: agent.session.did,
      collection: POST_COLLECTION,
      rkey: rkeyFor(content),
      record,
    });
    await prisma.content.update({
      where: { id: content.id },
      data: { atprotoUri: response.data.uri, atprotoCid: response.data.cid },
    });
  } catch (ex) {
    // A failed mirror must not fail the local publish.
    console.error(`${contentOwner.username}: bluesky publish failed.\n${ex}`);
  }
}

export async function deleteFromBluesky(contentOwner: User, content: Content): Promise<void> {
  if (!content.atprotoUri || !hasBlueskyCredentials(contentOwner)) return;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return;

  try {
    await agent.com.atproto.repo.deleteRecord({
      repo: agent.session.did,
      collection: POST_COLLECTION,
      rkey: rkeyOfUri(content.atprotoUri),
    });
  } catch (ex) {
    console.error(`${contentOwner.username}: bluesky delete failed.\n${ex}`);
  }
}

// Following a Bluesky account for real, when the local user has credentials —
// otherwise the follow is local-only and we just poll their public feed.
export async function followOnBluesky(contentOwner: User, userRemote: UserRemote): Promise<void> {
  if (!userRemote.atprotoDid || !hasBlueskyCredentials(contentOwner)) return;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return;

  try {
    await agent.follow(userRemote.atprotoDid);
  } catch (ex) {
    console.error(`${contentOwner.username}: bluesky follow failed.\n${ex}`);
  }
}

export async function unfollowOnBluesky(contentOwner: User, userRemote: UserRemote): Promise<void> {
  if (!userRemote.atprotoDid || !hasBlueskyCredentials(contentOwner)) return;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return;

  try {
    // The follow record's uri lives on the *viewer* state of their profile.
    const profile = await agent.app.bsky.actor.getProfile({ actor: userRemote.atprotoDid });
    const followUri = profile.data.viewer?.following;
    if (followUri) await agent.deleteFollow(followUri);
  } catch (ex) {
    console.error(`${contentOwner.username}: bluesky unfollow failed.\n${ex}`);
  }
}

// --- reading a followed Bluesky account ------------------------------------

export function isAtprotoUserRemote(userRemote: Pick<UserRemote, 'atprotoDid'>): boolean {
  return !!userRemote.atprotoDid;
}

type FeedPost = {
  post?: {
    uri?: string;
    cid?: string;
    author?: { handle?: string; displayName?: string; avatar?: string; did?: string };
    record?: { text?: string; createdAt?: string; facets?: never[]; reply?: { parent?: { uri?: string } } };
    replyCount?: number;
    likeCount?: number;
    indexedAt?: string;
  };
};

// An unauthenticated agent is enough to read a public author feed.
function readAgent(userRemote: UserRemote): AtpAgent {
  return new AtpAgent({ service: userRemote.atprotoPdsUrl || PUBLIC_BSKY_PDS });
}

export async function fetchAuthorFeed(userRemote: UserRemote, limit = 50): Promise<FeedPost[]> {
  const agent = readAgent(userRemote);
  const response = await agent.app.bsky.feed.getAuthorFeed({ actor: userRemote.atprotoDid!, limit });
  return (response.data.feed || []) as FeedPost[];
}

// Maps a Bluesky feed onto ContentRemote, matching what feeds.ts does for Atom:
// same 30-day cutoff, same skip-if-unchanged behaviour, same row shape — so the
// reader renders atproto posts with no special-casing.
export async function mapAtprotoFeedIntoDb(userRemote: UserRemote, feed: FeedPost[]): Promise<void> {
  const cutoff = new Date(Date.now() - FEED_MAX_DAYS_OLD);
  let inserted = 0;
  let skipped = 0;

  for (const item of feed) {
    const post = item?.post;
    if (!post?.uri || !post.record) {
      skipped++;
      continue;
    }

    const createdAt = new Date(post.record.createdAt || post.indexedAt || Date.now());
    if (createdAt < cutoff) {
      skipped++;
      continue;
    }

    const existing = await getRemoteContent(userRemote.localUsername, post.uri);
    if (existing?.type === 'comment' || (existing && +(existing.updatedAt || 0) === +createdAt)) {
      skipped++;
      continue;
    }

    const handle = post.author?.handle || userRemote.atprotoHandle || '';
    const view = renderPostText(post.record.text || '', post.record.facets || []);
    // A reply on Bluesky is a post whose record carries a parent; store it as a
    // post either way — threading it to a local item needs the parent to be one
    // of ours, which the bridge can't yet establish.
    const isReply = !!post.record.reply?.parent?.uri;

    try {
      await saveRemoteContent({
        id: existing?.id || -1,
        avatar: post.author?.avatar || userRemote.avatar,
        commentsCount: post.replyCount || 0,
        commentsUpdated: null,
        createdAt,
        updatedAt: createdAt,
        creator: post.author?.displayName || handle,
        fromUsername: userRemote.profileUrl,
        fromUserRemoteId: userRemote.id.toString(),
        link: bskyPermalink(handle, post.uri),
        postId: post.uri,
        thread: isReply ? post.record.reply!.parent!.uri! : null,
        title: '',
        toUsername: userRemote.localUsername,
        type: 'post',
        username: handle,
        view,
      } as unknown as ContentRemote);
      inserted++;
    } catch (ex) {
      console.error(`${userRemote.localUsername} - ${userRemote.atprotoDid}: atproto insert failed.\n${ex}`);
    }
  }

  console.debug(
    `${userRemote.localUsername} - ${userRemote.atprotoHandle}: parsed ${inserted} atproto entries, skipped ${skipped}.`
  );
}

export async function pollAtprotoUser(userRemote: UserRemote): Promise<void> {
  try {
    await mapAtprotoFeedIntoDb(userRemote, await fetchAuthorFeed(userRemote));
  } catch (ex) {
    console.error(`${userRemote.localUsername} - ${userRemote.atprotoHandle}: atproto feed FAILED.\n${ex}`);
  }
}
