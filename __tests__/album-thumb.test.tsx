import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'i18n';
import { cleanup, fireEvent, render } from '@testing-library/react';
import ContentThumb from 'components/content/ContentThumb';

afterEach(cleanup);

// A thumb in a photo album has two jobs that look identical up to the click:
// blow the photo up into the album's lightbox, or go to the item's own page.
// Whichever it picks, the markup is the same <a href> — only preventDefault
// tells them apart, so that is what these assert on.

const base = {
  username: 'alice',
  section: 'photos',
  album: 'etc',
  name: 'a-photo',
  thumb: '/resource/alice/photos/etc/thumb.jpg',
};

function clickThumb(
  item: Partial<typeof base> & Record<string, unknown> = {},
  currentContent?: { forceRefresh?: boolean | null }
) {
  const onOpen = vi.fn();
  const { getByRole } = render(
    <IntlProvider defaultLocale="en" locale="en" messages={{}}>
      <ContentThumb item={{ ...base, ...item } as never} currentContent={currentContent} onOpen={onOpen} />
    </IntlProvider>
  );
  const link = getByRole('link');
  const defaultPrevented = !fireEvent.click(link);
  return { onOpen, followedLink: !defaultPrevented };
}

describe('clicking an album thumb', () => {
  it('opens the lightbox for an ordinary photo', () => {
    const { onOpen, followedLink } = clickThumb({ prefetchImages: ['/resource/alice/photos/etc/a-photo.jpg'] });

    expect(onOpen).toHaveBeenCalled();
    expect(followedLink).toBe(false);
  });

  it('goes to the page for a blank template, whose body is the whole point of it', () => {
    const { onOpen, followedLink } = clickThumb({
      template: 'blank',
      prefetchImages: ['/resource/alice/photos/etc/a-photo.jpg'],
    });

    expect(onOpen).not.toHaveBeenCalled();
    expect(followedLink).toBe(true);
  });

  it('goes to the page for an item whose rendering needs its own style or code', () => {
    // `forceRefresh` is the server's mark for exactly that — the lightbox would
    // show the photo with none of what the page does to it.
    const { onOpen, followedLink } = clickThumb({
      forceRefresh: true,
      prefetchImages: ['/resource/alice/photos/etc/a-photo.jpg'],
    });

    expect(onOpen).not.toHaveBeenCalled();
    expect(followedLink).toBe(true);
  });

  it('still opens the lightbox when it is the album, not the photo, that has custom code', () => {
    const { onOpen, followedLink } = clickThumb(
      { prefetchImages: ['/resource/alice/photos/etc/a-photo.jpg'] },
      { forceRefresh: true }
    );

    expect(onOpen).toHaveBeenCalled();
    expect(followedLink).toBe(false);
  });

  it('goes to the page for an item with no photos in it', () => {
    const { onOpen, followedLink } = clickThumb({ prefetchImages: [] });

    expect(onOpen).not.toHaveBeenCalled();
    expect(followedLink).toBe(true);
  });

  it('goes to the page outside the photos section', () => {
    const { onOpen, followedLink } = clickThumb({ section: 'writing', prefetchImages: ['/a.jpg'] });

    expect(onOpen).not.toHaveBeenCalled();
    expect(followedLink).toBe(true);
  });
});
