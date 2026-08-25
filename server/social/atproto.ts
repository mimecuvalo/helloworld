import { AtpAgent, RichText } from '@atproto/api';
import type { AtpSessionData, AtpSessionEvent } from '@atproto/api';
import type { Content, ContentRemote, User, UserRemote } from '../../generated/prisma/client';
import prisma from '../prisma';
import { PUBLIC_BSKY_PDS, resolveHandleToDid } from './atproto-identity';
import { buildUrl } from '../../lib/url-factory';
import {
  type BlobRef,
  POST_COLLECTION,
  atUriFromBskyUrl,
  bskyPermalink,
  buildPostRecord,
  imageUrlsIn,
  renderEmbed,
  renderPostText,
  rkeyFor,
  rkeyOfUri,
  truncateToGraphemes,
} from './atproto-records';
import { getRemoteContent, getRemoteUser, saveRemoteContent, saveRemoteUser } from './db';
import { decryptSecret, encryptSecret } from '../secrets';
import { BLUESKY_APP_PASSWORD } from '../config';

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

// The password may live on the row or in the environment; either counts.
function appPasswordFor(user: Pick<User, 'atprotoAppPassword'>): string {
  return decryptSecret(user.atprotoAppPassword) || BLUESKY_APP_PASSWORD;
}

export function hasBlueskyCredentials(user: Pick<User, 'atprotoHandle' | 'atprotoAppPassword'>): boolean {
  return !!(user.atprotoHandle && appPasswordFor(user));
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
    await agent.login({ identifier: user.atprotoHandle!, password: appPasswordFor(user) });
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

// Bluesky caps a blob at 1MB for images; anything bigger is skipped rather than
// rejected mid-publish.
const MAX_BLOB_BYTES = 1_000_000;

async function uploadImage(agent: AtpAgent, url: string): Promise<BlobRef | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BLOB_BYTES) return null;

    const encoding = response.headers.get('content-type') || 'image/jpeg';
    if (!encoding.startsWith('image/')) return null;

    const { data } = await agent.com.atproto.repo.uploadBlob(bytes, { encoding });
    return data.blob;
  } catch {
    // A picture that won't upload shouldn't stop the post going out.
    return null;
  }
}

// Builds the reply refs for a post that answers a Bluesky post, resolving a
// bsky.app permalink back to its at:// uri when that's what the editor left.
async function replyRefFor(agent: AtpAgent, threadUrl: string) {
  try {
    const uri = await atUriFromBskyUrl(threadUrl, resolveHandleToDid);
    if (!uri) return null;

    const { data } = await agent.app.bsky.feed.getPosts({ uris: [uri] });
    const parent = data.posts?.[0];
    if (!parent?.cid) return null;

    const parentRecord = parent.record as { reply?: { root?: { uri: string; cid: string } } } | undefined;
    return {
      root: parentRecord?.reply?.root || { uri: parent.uri, cid: parent.cid },
      parent: { uri: parent.uri, cid: parent.cid },
    };
  } catch {
    return null;
  }
}

export async function publishToBluesky(host: string, contentOwner: User, content: Content): Promise<void> {
  if (content.hidden || !hasBlueskyCredentials(contentOwner)) return;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return;

  // Prefer real inline images; fall back to a link card with a thumbnail.
  const imageBlobs: { blob: BlobRef; alt: string }[] = [];
  for (const url of imageUrlsIn(host, content).slice(0, 4)) {
    const blob = await uploadImage(agent, url);
    if (blob) imageBlobs.push({ blob, alt: content.title || '' });
  }

  let thumbBlob: BlobRef | null = null;
  if (!imageBlobs.length && content.thumb) {
    thumbBlob = await uploadImage(agent, buildUrl({ host, pathname: content.thumb }));
  }

  // A post that replies to a Bluesky post should thread under it there rather
  // than appear as an unrelated top-level post.
  const reply = content.thread ? await replyRefFor(agent, content.thread) : null;

  const record = buildPostRecord(host, content, contentOwner, {
    imageBlobs: imageBlobs.length ? imageBlobs : undefined,
    thumbBlob: thumbBlob || undefined,
    reply: reply || undefined,
  });
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

// --- likes, reposts, replies ------------------------------------------------

// A ContentRemote from an atproto peer carries the at:// uri in postId; a like
// or repost needs that plus the record cid, which getPosts resolves.
async function resolvePostRef(agent: AtpAgent, uri: string): Promise<{ uri: string; cid: string } | null> {
  try {
    const { data } = await agent.app.bsky.feed.getPosts({ uris: [uri] });
    const post = data.posts?.[0];
    return post?.cid ? { uri: post.uri, cid: post.cid } : null;
  } catch {
    return null;
  }
}

function isAtprotoUri(uri: string | null | undefined): boolean {
  return !!uri?.startsWith('at://');
}

// Favouriting a Bluesky post in the reader should like it on Bluesky.
export async function likeOnBluesky(contentOwner: User, postUri: string, isLike: boolean): Promise<void> {
  if (!isAtprotoUri(postUri) || !hasBlueskyCredentials(contentOwner)) return;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return;

  try {
    if (isLike) {
      const ref = await resolvePostRef(agent, postUri);
      if (ref) await agent.like(ref.uri, ref.cid);
      return;
    }
    // Unlike needs the like record's own uri, which lives on the viewer state.
    const { data } = await agent.app.bsky.feed.getPosts({ uris: [postUri] });
    const likeUri = data.posts?.[0]?.viewer?.like;
    if (likeUri) await agent.deleteLike(likeUri);
  } catch (ex) {
    console.error(`${contentOwner.username}: bluesky like failed.\n${ex}`);
  }
}

// Reblogging a Bluesky post should repost it there.
export async function repostOnBluesky(contentOwner: User, postUri: string, isRepost: boolean): Promise<void> {
  if (!isAtprotoUri(postUri) || !hasBlueskyCredentials(contentOwner)) return;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return;

  try {
    if (isRepost) {
      const ref = await resolvePostRef(agent, postUri);
      if (ref) await agent.repost(ref.uri, ref.cid);
      return;
    }
    const { data } = await agent.app.bsky.feed.getPosts({ uris: [postUri] });
    const repostUri = data.posts?.[0]?.viewer?.repost;
    if (repostUri) await agent.deleteRepost(repostUri);
  } catch (ex) {
    console.error(`${contentOwner.username}: bluesky repost failed.\n${ex}`);
  }
}

// Commenting on a Bluesky post in the reader should reply to it there.
// Bluesky threads need both the immediate parent and the thread root.
export async function replyOnBluesky(contentOwner: User, parentUri: string, text: string): Promise<void> {
  if (!isAtprotoUri(parentUri) || !hasBlueskyCredentials(contentOwner) || !text.trim()) return;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return;

  try {
    const { data } = await agent.app.bsky.feed.getPosts({ uris: [parentUri] });
    const parent = data.posts?.[0];
    if (!parent?.cid) return;

    const parentRecord = parent.record as { reply?: { root?: { uri: string; cid: string } } } | undefined;
    const root = parentRecord?.reply?.root || { uri: parent.uri, cid: parent.cid };

    const richText = new RichText({ text: truncateToGraphemes(text) });
    await richText.detectFacets(agent);

    await agent.post({
      text: richText.text,
      facets: richText.facets,
      createdAt: new Date().toISOString(),
      reply: { root, parent: { uri: parent.uri, cid: parent.cid } },
    });
  } catch (ex) {
    console.error(`${contentOwner.username}: bluesky reply failed.\n${ex}`);
  }
}

// --- profile + graph --------------------------------------------------------

// Push the blog's identity onto the linked Bluesky account, so the two don't
// drift. Only fills fields the blog actually has.
export async function syncProfileToBluesky(host: string, contentOwner: User): Promise<void> {
  if (!hasBlueskyCredentials(contentOwner)) return;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return;

  try {
    await agent.upsertProfile(async (existing) => ({
      ...existing,
      displayName: contentOwner.name || existing?.displayName,
      description: contentOwner.description || existing?.description,
    }));
  } catch (ex) {
    console.error(`${contentOwner.username}: bluesky profile sync failed.\n${ex}`);
  }
}

type GraphActor = { did?: string; handle?: string; displayName?: string; avatar?: string };

// Bluesky followers, so someone who follows you there shows up in the Followers
// list next to your fediverse followers.
export async function syncFollowersFromBluesky(contentOwner: User): Promise<number> {
  if (!hasBlueskyCredentials(contentOwner) || !contentOwner.atprotoDid) return 0;

  const agent = await getAgent(contentOwner);
  if (!agent?.session) return 0;

  let synced = 0;
  try {
    const { data } = await agent.app.bsky.graph.getFollowers({ actor: contentOwner.atprotoDid, limit: 100 });
    for (const follower of (data.followers || []) as GraphActor[]) {
      if (!follower.did || !follower.handle) continue;

      const profileUrl = `https://bsky.app/profile/${follower.handle}`;
      const existing = await getRemoteUser(contentOwner.username, profileUrl);
      await saveRemoteUser({
        ...existing,
        localUsername: contentOwner.username,
        username: follower.handle,
        name: follower.displayName || follower.handle,
        profileUrl,
        feedUrl: '',
        atprotoDid: follower.did,
        atprotoHandle: follower.handle,
        atprotoPdsUrl: PUBLIC_BSKY_PDS,
        avatar: follower.avatar || '',
        favicon: follower.avatar || '',
        follower: true,
        following: existing?.following ?? false,
        order: existing?.order ?? Math.pow(2, 31) - 1,
      } as unknown as UserRemote);
      synced++;
    }
  } catch (ex) {
    console.error(`${contentOwner.username}: bluesky follower sync failed.\n${ex}`);
  }

  return synced;
}

// --- reading a followed Bluesky account ------------------------------------

export function isAtprotoUserRemote(userRemote: Pick<UserRemote, 'atprotoDid'>): boolean {
  return !!userRemote.atprotoDid;
}

// Was this at:// uri one of our own mirrored posts? If so a reply to it is a
// comment on the local post, not a standalone item in the reader.
async function findLocalContentByAtprotoUri(localUsername: string, uri: string) {
  return await prisma.content.findFirst({
    select: { name: true },
    where: { username: localUsername, atprotoUri: uri },
  });
}

type FeedPost = {
  post?: {
    uri?: string;
    cid?: string;
    author?: { handle?: string; displayName?: string; avatar?: string; did?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record?: { text?: string; createdAt?: string; facets?: any[]; reply?: { parent?: { uri?: string } } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    embed?: any;
    replyCount?: number;
    likeCount?: number;
    indexedAt?: string;
  };
  // Present when the followee reposted someone else's post rather than writing
  // it. Without this the original author's post gets filed under the followee.
  reason?: { $type?: string; by?: { handle?: string; displayName?: string } };
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
    // Text, then whatever the post carried: images, a link card, a video, or a
    // quoted post. Text-only rendering drops the entire point of most posts.
    const view = renderPostText(post.record.text || '', post.record.facets || []) + renderEmbed(post.embed);

    // A repost is someone else's post surfaced by the followee — attribute it
    // to whoever actually wrote it, and say who boosted it.
    const isRepost = !!item.reason?.$type?.includes('reasonRepost');
    const repostedBy = item.reason?.by?.displayName || item.reason?.by?.handle || userRemote.username;

    // A reply to one of our own mirrored posts is a comment on that post.
    const parentUri = post.record.reply?.parent?.uri;
    const localParent = parentUri ? await findLocalContentByAtprotoUri(userRemote.localUsername, parentUri) : null;

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
        thread: parentUri || null,
        localContentName: localParent?.name || null,
        title: isRepost ? `${repostedBy} reposted` : '',
        toUsername: userRemote.localUsername,
        type: localParent ? 'comment' : 'post',
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
