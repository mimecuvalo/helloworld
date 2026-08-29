import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { useCallback, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hono } from 'hono';
import Editor from 'components/editor/Editor';
import type { AddedMedia } from 'components/editor/image-upload';
import { unfurlRoutes } from 'server/routes/unfurl';
import { createLiteYouTubeVideos } from 'util/media';
import type { AppEnv } from 'server/env';
import { EditorProvider } from 'lib/editor-context';

beforeAll(() => {
  // ProseMirror measures the selection to place the bubble menu; jsdom has no layout.
  const emptyRect = { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } as DOMRect;
  Range.prototype.getClientRects = () => Object.assign([], { item: () => null });
  Range.prototype.getBoundingClientRect = () => emptyRect;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubUnfurl(payload: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const thumbs: string[] = [];

function Harness({ content = '' }: { content?: string }) {
  const [value, setValue] = useState(content);
  const handleChange = useCallback((_name: string, next: string) => setValue(next), []);
  const handleMediaAdd = useCallback((media: AddedMedia) => {
    thumbs.push(media.thumb);
  }, []);

  return (
    <EditorProvider>
      <Editor
        name="test-editor"
        section="main"
        album=""
        defaultValue={value}
        onChange={handleChange}
        onMediaAdd={handleMediaAdd}
      />
    </EditorProvider>
  );
}

async function pasteInto(text: string, content?: string) {
  const user = userEvent.setup();
  render(<Harness content={content} />);
  const el = await screen.findByRole('textbox');
  el.focus();
  await user.paste(text);
  return () => document.querySelector('.ProseMirror')?.innerHTML || '';
}

describe('pasting into the editor', () => {
  it('unfurls a pasted url into an embed with a link back to the source', async () => {
    thumbs.length = 0;
    stubUnfurl({
      wasMediaFound: true,
      title: 'A video',
      image: 'https://img.example/v.jpg',
      iframe: { src: 'https://www.youtube.com/embed/abc', width: 480, height: 270, frameBorder: 0, allow: 'autoplay' },
    });

    const html = await pasteInto('https://www.youtube.com/watch?v=abc');

    await waitFor(() => expect(html()).toContain('<iframe'));
    expect(html()).toContain('src="https://www.youtube.com/embed/abc"');
    // The embed's own dimensions have to survive the round trip through the schema.
    expect(html()).toContain('width="480"');
    expect(html()).toContain('height="270"');
    expect(html()).toContain('<h1>A video</h1>');
    expect(html()).toContain('href="https://www.youtube.com/watch?v=abc"');
    // The raw url isn't left behind next to the embed it turned into.
    expect(html()).not.toContain('>https://www.youtube.com/watch?v=abc<br');
    expect(thumbs).toContain('https://img.example/v.jpg');
  });

  it('unfurls a pasted image url into an image', async () => {
    stubUnfurl({ wasMediaFound: false });

    const html = await pasteInto('https://img.example/cat.png');

    await waitFor(() => expect(html()).toContain('<img'));
    expect(html()).toContain('src="https://img.example/cat.png"');
  });

  it('embeds pasted iframe markup, keeping its size', async () => {
    const fetchMock = stubUnfurl({ wasMediaFound: false });

    const html = await pasteInto('<iframe src="https://npr.example/embed" width="640" height="360"></iframe>');

    await waitFor(() => expect(html()).toContain('<iframe'));
    expect(html()).toContain('src="https://npr.example/embed"');
    expect(html()).toContain('width="640"');
    expect(html()).toContain('height="360"');
    // Embed markup is self-contained; it never needs the unfurl endpoint.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to a plain link when there is nothing to embed', async () => {
    stubUnfurl({ wasMediaFound: false, title: '', image: '' });

    const html = await pasteInto('https://example.com/essay');

    await waitFor(() => expect(html()).toContain('href="https://example.com/essay"'));
    expect(html()).not.toContain('<iframe');
    expect(html()).not.toContain('<img');
  });

  it('links the selection instead of unfurling when a url is pasted over text', async () => {
    const fetchMock = stubUnfurl({ wasMediaFound: true, title: 'A video', image: '', iframe: { src: 'https://e/1' } });
    const user = userEvent.setup();
    render(<Harness content="<p>hello world</p>" />);
    const el = await screen.findByRole('textbox');
    el.focus();
    await user.keyboard('{Control>}a{/Control}');
    await user.paste('https://example.com/essay');

    const html = () => document.querySelector('.ProseMirror')?.innerHTML || '';
    await waitFor(() => expect(html()).toContain('href="https://example.com/essay"'));
    expect(html()).toContain('>hello world</a>');
    expect(html()).not.toContain('<iframe');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('the unfurl endpoint', () => {
  const post = async (url: string) => {
    const app = new Hono<AppEnv>();
    app.use('*', async (c, next) => {
      c.set('ctx', { currentUsername: 'alice', user: { email: 'alice@example.com' } } as never);
      await next();
    });
    app.route('/', unfurlRoutes);
    const response = await app.request('/unfurl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return response.json() as Promise<any>;
  };

  // What youtube actually serves a plain user agent: watch pages carry the full
  // set of tags, shorts pages come back as an empty js shell.
  const WATCH_PAGE = `<html><head>
      <link rel="alternate" type="application/json+oembed" href="https://www.youtube.com/oembed?url=x" />
      <meta property="og:title" content="A video" />
      <meta property="og:image" content="https://i.ytimg.com/vi/abc123/maxresdefault.jpg" />
      <meta property="og:video:url" content="https://www.youtube.com/embed/abc123" />
    </head></html>`;
  const EMPTY_PAGE = '<html><head><title> - YouTube</title></head><body></body></html>';

  const serve = (page: string, oEmbed: Response | null) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: any) => {
        if (String(input).includes('oembed')) {
          return oEmbed ? oEmbed.clone() : new Response('nope', { status: 404 });
        }
        return new Response(page, { status: 200, headers: { 'Content-Type': 'text/html' } });
      })
    );

  it('prefers oEmbed data for a youtube video', async () => {
    serve(
      WATCH_PAGE,
      new Response(
        JSON.stringify({
          title: 'A video',
          thumbnail_url: 'https://img.example/video.jpg',
          html: '<iframe src="https://www.youtube.com/embed/abc123" width="480" height="270"></iframe>',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    expect(await post('https://www.youtube.com/watch?v=abc123')).toMatchObject({
      wasMediaFound: true,
      title: 'A video',
      image: 'https://img.example/video.jpg',
      iframe: { src: 'https://www.youtube.com/embed/abc123' },
    });
  });

  it("takes the title off the page when a video's oEmbed call fails", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    serve(WATCH_PAGE, null);

    expect(await post('https://www.youtube.com/watch?v=abc123')).toMatchObject({
      wasMediaFound: true,
      title: 'A video',
      image: 'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
      iframe: { src: 'https://www.youtube.com/embed/abc123' },
    });
  });

  // Shorts serve neither oEmbed nor og: tags, so the video id in the pasted url
  // is all there is to build an embed from.
  it.each([
    ['https://www.youtube.com/watch?v=abc123', 'abc123'],
    ['https://www.youtube.com/watch?v=abc123&list=PLxyz&index=2', 'abc123'],
    ['https://youtu.be/abc123?si=tracking', 'abc123'],
    ['https://www.youtube.com/shorts/abc123', 'abc123'],
    ['https://www.youtube.com/live/abc123', 'abc123'],
    ['https://m.youtube.com/watch?v=abc123', 'abc123'],
  ])('still embeds %s from a page with no tags at all', async (url, videoId) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    serve(EMPTY_PAGE, null);

    expect(await post(url)).toMatchObject({
      wasMediaFound: true,
      // The shell's own ' - YouTube' <title> is not a headline worth keeping.
      title: '',
      image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      iframe: { src: `https://www.youtube.com/embed/${videoId}`, width: 480, height: 270 },
    });
  });

  it('leaves non-youtube pages with no video alone', async () => {
    serve('<html><head><meta property="og:title" content="An article" /></head></html>', null);

    expect(await post('https://example.com/article')).toMatchObject({
      wasMediaFound: false,
      title: 'An article',
      image: '',
    });
  });

  it('falls back to og: tags when a page advertises a broken oEmbed endpoint', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    serve(
      `<html><head>
         <link rel="alternate" type="application/json+oembed" href="https://example.com/oembed?url=x" />
         <meta property="og:title" content="An article" />
         <meta property="og:image" content="https://example.com/hero.jpg" />
       </head></html>`,
      null
    );

    expect(await post('https://example.com/article')).toMatchObject({
      wasMediaFound: true,
      title: 'An article',
      image: 'https://example.com/hero.jpg',
    });
  });
});

describe('rendering a stored youtube embed', () => {
  it('labels the play button from the iframe title, and copes without one', () => {
    const withTitle = createLiteYouTubeVideos(
      '<iframe src="https://www.youtube.com/embed/abc123" title="A video"></iframe>'
    );
    expect(withTitle).toContain('<lite-youtube videoid="abc123" playlabel="Play: A video">');

    const without = createLiteYouTubeVideos('<iframe src="https://www.youtube.com/embed/abc123"></iframe>');
    expect(without).toContain('playlabel="Play"');
    expect(without).not.toContain('undefined');
  });
});
