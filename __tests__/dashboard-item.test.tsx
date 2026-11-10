import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'i18n';

vi.mock('lib/read-queue', () => ({ queueRead: vi.fn(() => Promise.resolve()) }));

import DashboardItem from 'components/dashboard/DashboardItem';
import type { RemotePost } from 'lib/remote-queries';

afterEach(cleanup);

// The shape a comic feed sends: the strip wrapped in a link to its page.
const POST = {
  fromUsername: 'alice',
  postId: 'p1',
  username: 'comics',
  title: 'A comic',
  link: 'https://comics.example/strip-1',
  createdAt: new Date('2026-11-09T12:00:00Z').toISOString(),
  read: false,
  view: '<a href="https://comics.example/strip-1"><img src="https://comics.example/strip-1.png" width="684" height="1129" /></a><p>words</p>',
} as unknown as RemotePost;

function renderItem() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <IntlProvider defaultLocale="en" locale="en" messages={{}}>
      <QueryClientProvider client={client}>
        <DashboardItem contentRemote={POST} />
      </QueryClientProvider>
    </IntlProvider>
  );
}

describe('DashboardItem', () => {
  // React 19 rewrites innerHTML whenever the dangerouslySetInnerHTML object is
  // new, same string or not. Marking the item read on scroll re-renders it,
  // and a rewrite there reloads every image and kills any video mid-play.
  it('keeps the same post markup across a re-render from being marked read', async () => {
    const { container } = renderItem();
    const img = container.querySelector('img[src$="strip-1.png"]')!;

    // jsdom has no layout, so the item always reads as scrolled to the bottom.
    await act(async () => {
      fireEvent.scroll(window);
    });

    expect(container.querySelector('[class*="itemRead"]')).not.toBeNull();
    expect(container.querySelector('img[src$="strip-1.png"]')).toBe(img);
  });

  it('badges a linked image on hover without touching the post markup', async () => {
    const { container } = renderItem();
    const img = container.querySelector('img[src$="strip-1.png"]') as HTMLImageElement;

    await act(async () => {
      fireEvent.mouseOver(img);
    });

    const badge = document.querySelector('[aria-label="open link"]') as HTMLAnchorElement;
    expect(badge.href).toBe('https://comics.example/strip-1');
    // The badge is tied to the image by anchor name, not by script-set offsets.
    expect(img.style.getPropertyValue('anchor-name')).toMatch(/^--image-link-/);
    expect(badge.style.getPropertyValue('position-anchor')).toBe(img.style.getPropertyValue('anchor-name'));
    expect(container.querySelector('img[src$="strip-1.png"]')).toBe(img);
  });
});
