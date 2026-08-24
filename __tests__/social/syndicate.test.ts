import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  getRemoteFriends: vi.fn(),
  getRemoteUser: vi.fn(),
  saveRemoteUser: vi.fn(),
}));
const discover = vi.hoisted(() => ({ getUserRemoteInfo: vi.fn() }));

vi.mock('server/social/db', () => db);
vi.mock('server/social/discover-user', () => discover);

import { findMentions, syndicateContent, syndicateDelete } from 'server/social/syndicate';
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
    expect(bodyOf().object.cc).toContain('https://remote.example/bob');
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

  it('addresses the activity publicly and cc:s the followers collection', async () => {
    db.getRemoteFriends.mockResolvedValue([[userRemote({ activityPubInboxUrl: inboxOf('one.example') })], []]);

    await syndicateContent(HOST, owner(), content());

    expect(bodyOf().to).toEqual(['https://www.w3.org/ns/activitystreams#Public']);
    expect(bodyOf().object.cc).toContain(
      `https://${HOST}/api/social/activitypub/followers?resource=${encodeURIComponent(`https://${HOST}/alice`)}`
    );
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
