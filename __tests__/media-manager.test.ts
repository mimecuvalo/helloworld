import { describe, expect, it, vi } from 'vitest';

// publicUrl reads the bucket name out of config at call time, and the service
// only ever formats urls with it — nothing here talks to S3.
vi.mock('server/s3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('server/s3')>()),
  publicUrl: (key: string) => `https://bucket.example/${key}`,
}));

const { assertOwnKey, groupAssets, ownPrefix } = await import('server/services/media');

const file = (key: string, size = 100, lastModified: string | null = '2026-01-01T00:00:00.000Z') => ({
  key,
  size,
  lastModified,
});

describe('ownPrefix', () => {
  it('defaults to the whole of the account that asked', () => {
    expect(ownPrefix('mime')).toBe('mime/');
  });

  it('adds the trailing slash a prefix needs to be a folder', () => {
    // Without it, listing `mime/photo` would also return `mime/photography/`.
    expect(ownPrefix('mime', 'mime/photos')).toBe('mime/photos/');
  });

  it("refuses another account's prefix", () => {
    expect(() => ownPrefix('mime', 'someone-else/')).toThrow();
  });

  it('refuses a prefix that tries to climb out of its own', () => {
    expect(() => ownPrefix('mime', 'mime/../someone-else/')).toThrow();
  });

  it('is not fooled by an account whose name is a prefix of another', () => {
    expect(() => ownPrefix('mime', 'mimecuvalo/photos/')).toThrow();
  });
});

describe('assertOwnKey', () => {
  it('allows a key under the account that asked', () => {
    expect(() => assertOwnKey('mime', 'mime/photos/a/123-x.jpg')).not.toThrow();
  });

  it("refuses another account's key", () => {
    expect(() => assertOwnKey('mime', 'someone-else/photos/a/123-x.jpg')).toThrow();
  });

  it('refuses a traversal', () => {
    expect(() => assertOwnKey('mime', 'mime/../someone-else/x.jpg')).toThrow();
  });
});

describe('groupAssets', () => {
  const medium = file('mime/photos/a/123-cat.jpg', 500_000);
  const original = file('mime/photos/a/original/123-cat.jpg', 4_000_000);
  const thumb = file('mime/photos/a/thumbs/123-cat.jpg', 20_000);

  it('folds the three sizes of one upload into one asset', () => {
    const assets = groupAssets({ medium: [medium], original: [original], thumb: [thumb] });

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toBe('123-cat.jpg');
    expect(assets[0].keys).toHaveLength(3);
  });

  it('totals the bytes across every size, which is what deleting it reclaims', () => {
    const [asset] = groupAssets({ medium: [medium], original: [original], thumb: [thumb] });

    expect(asset.size).toBe(4_520_000);
  });

  it('opens the biggest size and draws the smallest', () => {
    const [asset] = groupAssets({ medium: [medium], original: [original], thumb: [thumb] });

    expect(asset.url).toBe('https://bucket.example/mime/photos/a/original/123-cat.jpg');
    expect(asset.previewUrl).toBe('https://bucket.example/mime/photos/a/thumbs/123-cat.jpg');
  });

  it('keeps a non-image upload, which is only ever the one file', () => {
    const assets = groupAssets({ medium: [file('mime/files/a/123-notes.pdf')], original: [], thumb: [] });

    expect(assets[0].isImage).toBe(false);
    expect(assets[0].original).toBeNull();
    expect(assets[0].url).toBe('https://bucket.example/mime/files/a/123-notes.pdf');
  });

  it('still shows an image whose medium is gone, so it can be cleaned up', () => {
    // A half-deleted asset is exactly what a media manager has to be able to
    // see: dropping it from the listing would strand the bytes for good.
    const assets = groupAssets({ medium: [], original: [original], thumb: [thumb] });

    expect(assets).toHaveLength(1);
    expect(assets[0].medium).toBeNull();
    expect(assets[0].keys).toEqual([original.key, thumb.key]);
  });

  it('dates an asset by its original, not by a derivative a backfill rewrote', () => {
    const [asset] = groupAssets({
      medium: [file('mime/photos/a/123-cat.jpg', 1, '2026-06-01T00:00:00.000Z')],
      original: [file('mime/photos/a/original/123-cat.jpg', 1, '2024-01-01T00:00:00.000Z')],
      thumb: [file('mime/photos/a/thumbs/123-cat.jpg', 1, '2026-06-01T00:00:00.000Z')],
    });

    expect(asset.lastModified).toBe('2024-01-01T00:00:00.000Z');
  });

  it('sorts newest first, which is the order an album is browsed in', () => {
    const assets = groupAssets({
      medium: [
        file('mime/photos/a/100-older.jpg', 1, '2024-01-01T00:00:00.000Z'),
        file('mime/photos/a/200-newer.jpg', 1, '2026-01-01T00:00:00.000Z'),
      ],
      original: [],
      thumb: [],
    });

    expect(assets.map((asset) => asset.name)).toEqual(['200-newer.jpg', '100-older.jpg']);
  });

  it('does not confuse two uploads that share a filename across folders', () => {
    // Grouping is by filename, so the listings it is handed must be one
    // folder's — the timestamp prefix is what keeps real uploads apart.
    const assets = groupAssets({
      medium: [file('mime/photos/a/123-cat.jpg'), file('mime/photos/a/456-cat.jpg')],
      original: [],
      thumb: [],
    });

    expect(assets).toHaveLength(2);
  });
});
