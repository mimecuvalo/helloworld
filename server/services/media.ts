import mime from 'mime';
import type { Context } from '../context';
import { ForbiddenError } from '../authorization';
import { deleteObjects, listObjects, publicUrl, type S3File } from '../s3';
import { ORIGINAL_DIR, THUMBS_DIR } from '../../util/constants';

// One upload, however many files it actually became. The bucket keeps three
// sizes of an image at three predictable keys (see util/constants.ts), and a
// raw listing shows every photo three times over with two directories of
// machinery in the way — so everything here is grouped back into the thing an
// author recognises as "a file I uploaded".
export type MediaAsset = {
  // The filename the three sizes share, which is what identifies the asset.
  name: string;
  // Every key that goes when this asset goes.
  keys: string[];
  original: string | null;
  medium: string | null;
  thumb: string | null;
  // Bytes across all the sizes — what deleting it actually reclaims.
  size: number;
  lastModified: string | null;
  // The biggest size there is: where "open" goes.
  url: string;
  // The smallest size there is: what the grid draws.
  previewUrl: string;
  isImage: boolean;
};

export type MediaListing = {
  prefix: string;
  folders: { prefix: string; name: string }[];
  assets: MediaAsset[];
  // Whether the folder holds more than one read of it will admit. An album is
  // never near this; a bucket root pointed somewhere odd could be.
  truncated: boolean;
};

const MAX_PAGES = 20;

/**
 * The prefix a request is allowed to look at. Every key in the bucket is filed
 * under the username that owns it, which makes this the whole of the check —
 * the same rule /api/derive-image already relies on.
 */
export function ownPrefix(username: string, prefix?: string | null): string {
  const wanted = prefix || `${username}/`;
  if (!wanted.startsWith(`${username}/`) || wanted.includes('..')) {
    throw new ForbiddenError('I call shenanigans.');
  }
  return wanted.endsWith('/') ? wanted : `${wanted}/`;
}

export function assertOwnKey(username: string, key: string): void {
  if (!key.startsWith(`${username}/`) || key.includes('..')) {
    throw new ForbiddenError('I call shenanigans.');
  }
}

const filenameOf = (key: string) => key.slice(key.lastIndexOf('/') + 1);

/** Every page under a prefix, up to the point where it stops being reasonable. */
async function listAll(prefix: string, delimiter?: string) {
  const files: S3File[] = [];
  const folders: string[] = [];
  let continuationToken: string | undefined;
  let pages = 0;
  let truncated = false;

  do {
    const page = await listObjects({ prefix, delimiter, continuationToken });
    files.push(...page.files);
    folders.push(...page.folders);
    continuationToken = page.nextToken;
    if (++pages >= MAX_PAGES && continuationToken) {
      truncated = true;
      break;
    }
  } while (continuationToken);

  return { files, folders, truncated };
}

/**
 * The three listings of one album, folded into one asset per filename. Sizes
 * are matched on filename because that is exactly what the upload keeps
 * constant across the three of them.
 */
export function groupAssets(parts: { medium: S3File[]; original: S3File[]; thumb: S3File[] }): MediaAsset[] {
  const roles = ['original', 'medium', 'thumb'] as const;
  const byName = new Map<string, { original?: S3File; medium?: S3File; thumb?: S3File }>();

  for (const role of roles) {
    for (const file of parts[role]) {
      const name = filenameOf(file.key);
      const sizes = byName.get(name) || {};
      sizes[role] = file;
      byName.set(name, sizes);
    }
  }

  return [...byName.entries()]
    .map(([name, sizes]) => {
      // Not every asset has all three. A non-image upload is only ever the one
      // file, and a half-deleted image should still show up rather than vanish
      // from the manager that is supposed to be able to clean it up.
      const present = roles.map((role) => sizes[role]).filter((file): file is S3File => !!file);
      const biggest = sizes.original || sizes.medium || sizes.thumb!;
      const smallest = sizes.thumb || sizes.medium || sizes.original!;

      return {
        name,
        keys: present.map((file) => file.key),
        original: sizes.original?.key ?? null,
        medium: sizes.medium?.key ?? null,
        thumb: sizes.thumb?.key ?? null,
        size: present.reduce((total, file) => total + file.size, 0),
        // The original is the honest upload date: the derivatives are written
        // moments later, and rewritten whenever a backfill runs.
        lastModified: biggest.lastModified,
        url: publicUrl(biggest.key),
        previewUrl: publicUrl(smallest.key),
        isImage: !!mime.getType(name)?.startsWith('image/'),
      };
    })
    .sort((a, b) => (b.lastModified || '').localeCompare(a.lastModified || '') || a.name.localeCompare(b.name));
}

export async function listMedia(prefix: string): Promise<MediaListing> {
  const [root, original, thumb] = await Promise.all([
    listAll(prefix, '/'),
    listAll(`${prefix}${ORIGINAL_DIR}/`),
    listAll(`${prefix}${THUMBS_DIR}/`),
  ]);

  // The two derivative directories are this folder's own plumbing, not places
  // to browse into — their contents are already folded into the assets below.
  const plumbing = new Set([`${prefix}${ORIGINAL_DIR}/`, `${prefix}${THUMBS_DIR}/`]);

  return {
    prefix,
    folders: root.folders
      .filter((folder) => !plumbing.has(folder))
      .map((folder) => ({ prefix: folder, name: folder.slice(prefix.length).replace(/\/$/, '') }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    assets: groupAssets({ medium: root.files, original: original.files, thumb: thumb.files }),
    truncated: root.truncated || original.truncated || thumb.truncated,
  };
}

export type MediaUsage = { key: string; posts: { name: string; title: string }[] };

/**
 * Which posts point at these files. There is no backreference table yet, so
 * this asks the three columns that can hold a url whether the key appears in
 * them — a stored url is either `https://<bucket>/<key>` or the legacy
 * `/resource/<key>` form, and both end in the key itself.
 *
 * Unindexed, and deliberately so: it is one author's rows, read once, when they
 * press delete. Being told a photo is still on three posts is worth a seq scan.
 */
export async function findUsage(ctx: Context, keys: string[]): Promise<MediaUsage[]> {
  const username = ctx.currentUser!.username;
  for (const key of keys) assertOwnKey(username, key);
  if (!keys.length) return [];

  const rows = await ctx.prisma.content.findMany({
    where: {
      username,
      OR: keys.flatMap((key) => [
        { thumb: { contains: key } },
        { view: { contains: key } },
        { code: { contains: key } },
      ]),
    },
    // view and code are whole post bodies, but only the handful of rows that
    // matched come back, and the match has to be narrowed to a key out here.
    select: { name: true, title: true, thumb: true, view: true, code: true },
  });

  return keys
    .map((key) => ({
      key,
      posts: rows
        .filter((row) => row.thumb?.includes(key) || row.view?.includes(key) || row.code?.includes(key))
        .map((row) => ({ name: row.name, title: row.title })),
    }))
    .filter((usage) => usage.posts.length > 0);
}

export async function deleteMedia(ctx: Context, keys: string[]) {
  const username = ctx.currentUser!.username;
  for (const key of keys) assertOwnKey(username, key);
  return deleteObjects(keys);
}
