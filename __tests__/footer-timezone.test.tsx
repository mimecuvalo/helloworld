import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import AppProviders from 'components/providers/AppProviders';
import Footer from 'components/content/Footer';

// Published late enough in the UTC day that anywhere from UTC+2 eastward is already
// on the next calendar date. This is the shape that broke hydration in production:
// Vercel renders in UTC, the visitor's browser renders in their own zone, and the two
// disagree on the day -> React discards the SSR tree (minified error #418).
const content = {
  username: 'mime',
  section: 'photos',
  album: 'people',
  name: 'untitled-Nf95y0GZsX',
  count: 60,
  countRobot: 1,
  createdAt: new Date('2025-07-01T22:47:08.044Z'),
};

const originalTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTz;
});

function renderIn(timeZone: string) {
  process.env.TZ = timeZone;
  return renderToStaticMarkup(
    <AppProviders locale="en" messages={{}}>
      <Footer content={content} contentOwner={{ name: 'Mime Čuvalo' }} />
    </AppProviders>
  );
}

describe('Footer published date', () => {
  it('renders identically regardless of the ambient timezone', () => {
    // Sanity check that the harness can actually move the process timezone; without
    // this the assertion below would pass vacuously.
    process.env.TZ = 'UTC';
    const utcDay = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(content.createdAt);
    process.env.TZ = 'Asia/Tokyo';
    const tokyoDay = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(content.createdAt);
    expect(utcDay).not.toBe(tokyoDay);

    expect(renderIn('Asia/Tokyo')).toBe(renderIn('UTC'));
    expect(renderIn('America/New_York')).toBe(renderIn('UTC'));
  });

  it('formats the date in UTC and stamps a valid ISO datetime attribute', () => {
    const html = renderIn('Asia/Tokyo');
    expect(html).toContain('>07/01/25<');
    // React's SSR writes the attribute camelCased; the browser parser lowercases it on read.
    expect(html).toContain('dateTime="2025-07-01T22:47:08.044Z"');
  });
});
