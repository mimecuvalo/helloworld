import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import messages from 'i18n/compiled/en.json';
import { getMessages } from 'lib/messages';
import type { Context } from 'server/context';
import type { AppEnv } from 'server/env';
import { buildContentSecurityPolicy } from 'lib/security';
import { miscRoutes } from 'server/routes/misc';
import { unfurlRoutes } from 'server/routes/unfurl';
import { readFileSync } from 'node:fs';
import path from 'node:path';

vi.mock('server/social/discover-user', () => ({
  discoverUserRemoteInfoSaveAndSubscribe: vi.fn(),
}));
vi.mock('server/social/feeds', () => ({
  retrieveFeed: vi.fn(),
  parseFeedAndInsertIntoDb: vi.fn(),
}));
vi.mock('server/social/activitystreams', () => ({
  follow: vi.fn(),
  like: vi.fn(),
}));

import { discoverUserRemoteInfoSaveAndSubscribe } from 'server/social/discover-user';
import { follow as activityStreamsFollow } from 'server/social/activitystreams';
import { parseFeedAndInsertIntoDb, retrieveFeed } from 'server/social/feeds';
import { subscribeToFeed, unsubscribeFromFeed } from 'server/social';

function context(overrides: Partial<Context> = {}): Context {
  const ctx = {
    currentUsername: 'alice',
    currentUserEmail: 'alice@example.com',
    currentUserPicture: '',
    currentUser: { username: 'alice' },
    user: { email: 'alice@example.com' },
    hostname: 'example.com',
    prisma: {},
    loaders: {},
    request: new Request('https://example.com'),
    ...overrides,
  } as unknown as Context;
  ctx.fullUser = async () => ctx.currentUser as never;
  return ctx;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('migration regression coverage', () => {
  it('ships a populated English message catalog', () => {
    expect(Object.keys(messages).length).toBeGreaterThan(20);
  });

  it('does not dehydrate a catalog for the default locale', () => {
    // en renders off the inline `defaultMessage` ASTs instead; handing react-intl the
    // catalog as well put the whole thing (editor/admin strings included) into the SSR
    // payload of every page, signed out or not.
    expect(getMessages('en')).toBeUndefined();
    expect(getMessages('xx-LS')).toBeUndefined();
    expect(getMessages('fr')).toBeDefined();
  });

  it('uses a nonce instead of unsafe-inline scripts in production CSP', () => {
    const policy = buildContentSecurityPolicy({
      isDevelopment: false,
      nonce: 'request-nonce',
      s3BucketName: 'assets.example.com',
    });

    expect(policy).toContain("script-src 'self' 'nonce-request-nonce' 'strict-dynamic'");
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it('keeps the Flowers skin aligned with migrated content markup', () => {
    // Read off disk rather than importing: vitest hands back '' for a css
    // import, and this is asserting on the stylesheet's actual text.
    const flowersGlobalCss = readFileSync(path.join(process.cwd(), 'styles/flowers/globals.css'), 'utf8');
    expect(flowersGlobalCss).toContain('#hw-content > nav > a');
    expect(flowersGlobalCss).not.toContain('#hw-content article > nav');
    expect(flowersGlobalCss).toContain('#hw-sitemap-logo img');
    expect(flowersGlobalCss).toContain('transform: none');
    expect(flowersGlobalCss).toContain('visibility: visible');
    expect(flowersGlobalCss).toContain('transform: translateX(-50%)');
    expect(flowersGlobalCss).toContain('.hw-item > .hw-comments');
    expect(flowersGlobalCss).toContain('.hw-item .hw-view');
    expect(flowersGlobalCss).toContain('margin-left: -250px');
  });

  it('publishes an OpenSearch template matching the username search route', async () => {
    const response = await miscRoutes.request('https://example.com/opensearch?username=alice');
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(xml).toContain('https://example.com/alice/search/{searchTerms}');
    expect(xml).not.toContain('?q={searchTerms}');
  });

  it('uses YouTube oEmbed data when unfurling a video', async () => {
    // The watch page is fetched first; its advertised oEmbed link is what
    // supplies the title and thumbnail.
    const fetchMock = vi.fn(async (input: unknown) => {
      if (String(input).includes('oembed')) {
        return new Response(
          JSON.stringify({
            title: 'A video',
            thumbnail_url: 'https://img.example/video.jpg',
            html: '<iframe src="https://www.youtube.com/embed/abc" width="480" height="270"></iframe>',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        '<html><head><link rel="alternate" type="application/json+oembed" ' +
          'href="https://www.youtube.com/oembed?format=json&url=x" /></head></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const app = new Hono<AppEnv>();
    app.use('*', async (c, next) => {
      c.set('ctx', context());
      await next();
    });
    app.route('/', unfurlRoutes);

    const response = await app.request('/unfurl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=abc' }),
    });
    const result = await response.json();

    expect(result).toMatchObject({
      wasMediaFound: true,
      title: 'A video',
      image: 'https://img.example/video.jpg',
      iframe: { src: 'https://www.youtube.com/embed/abc', width: 480, height: 270 },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://www.youtube.com/oembed?'),
      expect.any(Object)
    );
  });

  it('ingests the initial feed and sends Follow when subscribing', async () => {
    const remote = { profileUrl: 'https://remote.example/alice', feedUrl: 'https://remote.example/feed' };
    vi.mocked(discoverUserRemoteInfoSaveAndSubscribe).mockResolvedValue(remote as never);
    vi.mocked(retrieveFeed).mockResolvedValue('<feed />');

    await expect(subscribeToFeed(context(), remote.profileUrl)).resolves.toBe(remote);

    expect(parseFeedAndInsertIntoDb).toHaveBeenCalledWith(remote, '<feed />');
    expect(activityStreamsFollow).toHaveBeenCalledWith(
      'example.com',
      expect.objectContaining({ username: 'alice' }),
      remote,
      true
    );
  });

  it('deletes a non-follower and sends Undo when unsubscribing', async () => {
    const remote = {
      id: 7,
      profileUrl: 'https://remote.example/alice',
      follower: false,
    };
    const findUnique = vi.fn().mockResolvedValue(remote);
    const remove = vi.fn().mockResolvedValue(remote);
    const ctx = context({
      prisma: { userRemote: { findUnique, delete: remove } } as unknown as Context['prisma'],
    });

    await expect(unsubscribeFromFeed(ctx, remote.profileUrl)).resolves.toBe(true);

    expect(remove).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(activityStreamsFollow).toHaveBeenCalledWith(
      'example.com',
      expect.objectContaining({ username: 'alice' }),
      remote,
      false
    );
  });
});
