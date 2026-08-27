import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  getRemoteContent: vi.fn(),
  getRemoteFriends: vi.fn(),
  getRemoteUser: vi.fn(),
  getReplyStatsForLocalContent: vi.fn(async () => ({ count: 0, updated: null })),
  saveRemoteUser: vi.fn(),
}));
const discover = vi.hoisted(() => ({ getActivityPubActor: vi.fn(), getUserRemoteInfo: vi.fn() }));

vi.mock('server/social/db', () => db);
vi.mock('server/social/discover-user', () => discover);

import { findMentions, resolveThreadUser, syndicateContent, syndicateDelete } from 'server/social/syndicate';
import { HOST, content, keys, user, userRemote } from './fixtures';

const owner = () => user({ privateKey: keys().privateKeyPkcs1 });
const inboxOf = (host: string) => `https://${host}/users/bob/inbox`;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 202 }));
  vi.stubGlobal('fetch', fetchMock);
  db.getRemoteFriends.mockResolvedValue([[], []]);
  db.getRemoteUser.mockResolvedValue(null);
  db.getRemoteContent.mockResolvedValue(null);
});

const inboxesHit = () => fetchMock.mock.calls.map(([url]) => url);
const bodyOf = (index = 0) => JSON.parse(fetchMock.mock.calls[index][1].body);

describe('findMentions', () => {
  it('finds microformats mention anchors', () => {
    expect(findMentions('<p>hi <a class="u-mention" href="https://remote.example/bob">@bob</a></p>')).toEqual([
      'https://remote.example/bob',
    ]);
  });

  it('finds bare @user@host handles in text', () => {
    expect(findMentions('<p>thanks @bob@remote.example!</p>')).toEqual(['https://remote.example/bob']);
  });

  it('does not treat an @ inside an attribute as a mention', () => {
    expect(findMentions('<img src="/a.jpg" alt="mail@example.com" />')).toEqual([]);
  });

  it('deduplicates a handle mentioned both ways', () => {
    const html = '<a class="u-mention" href="https://remote.example/bob">@bob@remote.example</a>';
    expect(findMentions(html)).toEqual(['https://remote.example/bob']);
  });

  it('returns nothing for content with no mentions', () => {
    expect(findMentions('<p>just a post</p>')).toEqual([]);
  });
});

describe('syndicateContent', () => {
  it('delivers a Create to every follower', async () => {
    db.getRemoteFriends.mockResolvedValue([
      [
        userRemote({ id: 1, activityPubInboxUrl: inboxOf('one.example') }),
        userRemote({ id: 2, profileUrl: 'https://two.example/bob', activityPubInboxUrl: inboxOf('two.example') }),
      ],
      [],
    ]);

    await syndicateContent(HOST, owner(), content());

    expect(inboxesHit()).toEqual([inboxOf('one.example'), inboxOf('two.example')]);
    expect(bodyOf()).toMatchObject({ type: 'Create', object: { type: 'Note', title: 'Hello' } });
  });

  it('sends an Update instead when the post is an edit', async () => {
    db.getRemoteFriends.mockResolvedValue([[userRemote({ activityPubInboxUrl: inboxOf('one.example') })], []]);

    await syndicateContent(HOST, owner(), content(), { isUpdate: true });

    expect(bodyOf()).toMatchObject({ type: 'Update', object: { type: 'Note' } });
  });

  it('never delivers hidden content', async () => {
    db.getRemoteFriends.mockResolvedValue([[userRemote({ activityPubInboxUrl: inboxOf('one.example') })], []]);

    await syndicateContent(HOST, owner(), content({ hidden: true }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('collapses followers who share an inbox into one delivery', async () => {
    // Two accounts on the same Mastodon instance.
    const shared = 'https://mastodon.example/inbox';
    db.getRemoteFriends.mockResolvedValue([
      [
        userRemote({ id: 1, profileUrl: 'https://mastodon.example/a', sharedInboxUrl: shared }),
        userRemote({ id: 2, profileUrl: 'https://mastodon.example/b', sharedInboxUrl: shared }),
      ],
      [],
    ]);

    await syndicateContent(HOST, owner(), content());

    expect(inboxesHit()).toEqual([shared]);
  });

  it('skips peers with no inbox and no salmon endpoint at all', async () => {
    db.getRemoteFriends.mockResolvedValue([
      [userRemote({ activityPubInboxUrl: null, sharedInboxUrl: null, salmonUrl: null })],
      [],
    ]);

    await syndicateContent(HOST, owner(), content());

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('delivers to a mentioned actor who is not a follower, and tags them', async () => {
    const mentioned = userRemote({
      profileUrl: 'https://remote.example/bob',
      activityPubActorUrl: 'https://remote.example/users/bob',
      activityPubInboxUrl: inboxOf('remote.example'),
    });
    db.getRemoteUser.mockResolvedValue(mentioned);

    await syndicateContent(HOST, owner(), content({ view: '<p>hey @bob@remote.example</p>' }));

    expect(inboxesHit()).toEqual([inboxOf('remote.example')]);
    expect(bodyOf().object.tag).toEqual([{ type: 'Mention', href: 'https://remote.example/users/bob', name: '@bob' }]);
    // The actor id, not the profile page: Mastodon registers a mention by
    // finding the actor URI in to/cc, and cc'ing the profile url delivered the
    // activity without it ever counting as a mention.
    expect(bodyOf().object.cc).toContain('https://remote.example/users/bob');
    expect(bodyOf().object.cc).not.toContain('https://remote.example/bob');
  });

  it('discovers a mentioned actor it has never seen before', async () => {
    const discovered = userRemote({
      profileUrl: 'https://new.example/bob',
      activityPubInboxUrl: inboxOf('new.example'),
    });
    db.getRemoteUser.mockResolvedValueOnce(null).mockResolvedValueOnce(discovered);
    discover.getUserRemoteInfo.mockResolvedValue(discovered);

    await syndicateContent(HOST, owner(), content({ view: '<p>hi @bob@new.example</p>' }));

    expect(discover.getUserRemoteInfo).toHaveBeenCalledWith('https://new.example/bob', 'alice');
    expect(db.saveRemoteUser).toHaveBeenCalledWith(discovered);
    expect(inboxesHit()).toEqual([inboxOf('new.example')]);
  });

  it('still delivers to everyone else when one mention cannot be resolved', async () => {
    db.getRemoteFriends.mockResolvedValue([[userRemote({ activityPubInboxUrl: inboxOf('one.example') })], []]);
    db.getRemoteUser.mockResolvedValue(null);
    discover.getUserRemoteInfo.mockRejectedValue(new Error('nxdomain'));

    await syndicateContent(HOST, owner(), content({ view: '<p>@ghost@nowhere.example</p>' }));

    expect(inboxesHit()).toEqual([inboxOf('one.example')]);
  });

  it('still delivers to the rest when one inbox is down', async () => {
    db.getRemoteFriends.mockResolvedValue([
      [
        userRemote({ id: 1, activityPubInboxUrl: inboxOf('down.example') }),
        userRemote({ id: 2, profileUrl: 'https://up.example/bob', activityPubInboxUrl: inboxOf('up.example') }),
      ],
      [],
    ]);
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(syndicateContent(HOST, owner(), content())).resolves.toBeUndefined();
    expect(inboxesHit()).toEqual([inboxOf('down.example'), inboxOf('up.example')]);
  });

  it('does nothing when there is nobody to deliver to', async () => {
    await syndicateContent(HOST, owner(), content());

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // The Reply button writes an `a.u-in-reply-to` anchor, which findMentions does
  // not look at, so before this the person being replied to heard nothing.
  describe('replies', () => {
    // A reply also GETs its own thread url, to turn it into an inReplyTo id —
    // so unlike everywhere else here, deliveries have to be picked out of the
    // call list rather than being all of it.
    const delivered = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST').map(([url]) => url);
    const deliveredBody = () =>
      JSON.parse(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')[0][1].body);

    const parentAuthor = () =>
      userRemote({
        profileUrl: 'https://remote.example/bob',
        activityPubActorUrl: 'https://remote.example/users/bob',
        activityPubInboxUrl: inboxOf('remote.example'),
      });
    const aReply = () =>
      content({
        section: 'comments',
        thread: 'https://remote.example/bob/1',
        threadUser: 'https://remote.example/bob',
        view: '<p>replying to <a class="u-in-reply-to" href="https://remote.example/bob/1">that</a></p>',
      });

    it('delivers a reply to the author of the post it answers', async () => {
      db.getRemoteUser.mockResolvedValue(parentAuthor());

      await syndicateContent(HOST, owner(), aReply());

      expect(db.getRemoteUser).toHaveBeenCalledWith('alice', 'https://remote.example/bob');
      expect(delivered()).toEqual([inboxOf('remote.example')]);
    });

    it('addresses and tags them, so it lands as a reply rather than a stray post', async () => {
      db.getRemoteUser.mockResolvedValue(parentAuthor());

      await syndicateContent(HOST, owner(), aReply());

      expect(deliveredBody().object.cc).toContain('https://remote.example/users/bob');
      expect(deliveredBody().object.tag).toEqual([
        { type: 'Mention', href: 'https://remote.example/users/bob', name: '@bob' },
      ]);
    });

    it('does not tag them twice when the body also mentions them', async () => {
      db.getRemoteUser.mockResolvedValue(parentAuthor());

      await syndicateContent(HOST, owner(), content({ ...aReply(), view: '<p>yes @bob@remote.example</p>' }));

      expect(deliveredBody().object.tag).toHaveLength(1);
      expect(delivered()).toEqual([inboxOf('remote.example')]);
    });

    it('reaches the author on top of the followers, not instead of them', async () => {
      db.getRemoteFriends.mockResolvedValue([[userRemote({ activityPubInboxUrl: inboxOf('one.example') })], []]);
      db.getRemoteUser.mockResolvedValue(parentAuthor());

      await syndicateContent(HOST, owner(), aReply());

      expect(delivered()).toEqual([inboxOf('one.example'), inboxOf('remote.example')]);
    });

    it('still posts when the thread author cannot be resolved', async () => {
      db.getRemoteFriends.mockResolvedValue([[userRemote({ activityPubInboxUrl: inboxOf('one.example') })], []]);
      db.getRemoteUser.mockResolvedValue(null);
      discover.getUserRemoteInfo.mockRejectedValue(new Error('nxdomain'));

      await syndicateContent(HOST, owner(), aReply());

      expect(delivered()).toEqual([inboxOf('one.example')]);
    });

    it('leaves a top-level post addressed exactly as before', async () => {
      db.getRemoteFriends.mockResolvedValue([[userRemote({ activityPubInboxUrl: inboxOf('one.example') })], []]);

      await syndicateContent(HOST, owner(), content({ threadUser: null }));

      expect(deliveredBody().object.tag).toEqual([]);
      expect(delivered()).toEqual([inboxOf('one.example')]);
    });
  });

  it('addresses the activity publicly and cc:s the followers collection', async () => {
    db.getRemoteFriends.mockResolvedValue([[userRemote({ activityPubInboxUrl: inboxOf('one.example') })], []]);

    await syndicateContent(HOST, owner(), content());

    expect(bodyOf().to).toEqual(['https://www.w3.org/ns/activitystreams#Public']);
    expect(bodyOf().object.cc).toContain(
      `https://${HOST}/api/social/activitypub/followers?resource=${encodeURIComponent(`https://${HOST}/alice`)}`
    );
  });
});

describe('resolveThreadUser', () => {
  it('reads the author off the copy of the parent already in the reader', async () => {
    db.getRemoteContent.mockResolvedValue({ fromUsername: 'https://remote.example/bob' });

    await expect(resolveThreadUser('alice', 'https://remote.example/bob/1')).resolves.toBe(
      'https://remote.example/bob'
    );
    // The ordinary case must not cost a network call.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to asking the post who wrote it', async () => {
    db.getRemoteContent.mockResolvedValue(null);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ attributedTo: 'https://remote.example/users/bob' }), {
        headers: { 'content-type': 'application/activity+json' },
      })
    );
    discover.getActivityPubActor.mockResolvedValue({ url: 'https://remote.example/bob' });

    await expect(resolveThreadUser('alice', 'https://remote.example/bob/1')).resolves.toBe(
      'https://remote.example/bob'
    );
    expect(discover.getActivityPubActor).toHaveBeenCalledWith('https://remote.example/users/bob');
  });

  it('reads attributedTo when it is an object or an array', async () => {
    db.getRemoteContent.mockResolvedValue(null);
    discover.getActivityPubActor.mockResolvedValue({ url: 'https://remote.example/bob' });

    for (const attributedTo of [{ id: 'https://remote.example/users/bob' }, ['https://remote.example/users/bob']]) {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ attributedTo }), {
          headers: { 'content-type': 'application/activity+json' },
        })
      );

      await expect(resolveThreadUser('alice', 'https://remote.example/bob/1')).resolves.toBe(
        'https://remote.example/bob'
      );
    }
  });

  it('falls back to the actor id when the actor advertises no profile page', async () => {
    db.getRemoteContent.mockResolvedValue(null);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ attributedTo: 'https://remote.example/users/bob' }), {
        headers: { 'content-type': 'application/activity+json' },
      })
    );
    discover.getActivityPubActor.mockResolvedValue({});

    await expect(resolveThreadUser('alice', 'https://remote.example/bob/1')).resolves.toBe(
      'https://remote.example/users/bob'
    );
  });

  it('is null for a post that is not a reply', async () => {
    await expect(resolveThreadUser('alice', '')).resolves.toBeNull();
    expect(db.getRemoteContent).not.toHaveBeenCalled();
  });

  it('is null rather than throwing when the parent cannot be fetched', async () => {
    db.getRemoteContent.mockResolvedValue(null);
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(resolveThreadUser('alice', 'https://remote.example/bob/1')).resolves.toBeNull();
  });
});

describe('syndicateDelete', () => {
  it('sends a Delete carrying a Tombstone to followers', async () => {
    db.getRemoteFriends.mockResolvedValue([[userRemote({ activityPubInboxUrl: inboxOf('one.example') })], []]);

    await syndicateDelete(HOST, owner(), content());

    expect(bodyOf()).toMatchObject({
      type: 'Delete',
      object: {
        type: 'Tombstone',
        id: `https://${HOST}/api/social/activitypub/message?resource=${encodeURIComponent(`https://${HOST}/alice/blog/hello`)}`,
      },
    });
  });

  it('does nothing when there are no followers', async () => {
    await syndicateDelete(HOST, owner(), content());

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('follower lookup', () => {
  it('asks for followers by profile url, not by bare username', async () => {
    // getRemoteFriends parses its argument as a content URL; a bare username
    // made new URL() throw and killed syndication outright.
    await syndicateContent(HOST, owner(), content());

    expect(db.getRemoteFriends).toHaveBeenCalledWith(`https://${HOST}/alice`);
  });

  it('asks the same way when announcing a delete', async () => {
    await syndicateDelete(HOST, owner(), content());

    expect(db.getRemoteFriends).toHaveBeenCalledWith(`https://${HOST}/alice`);
  });
});
