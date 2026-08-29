import * as cheerio from 'cheerio';
import mime from 'mime';
import { computeLqip, deriveImageVariants, derivedKeys } from '../server/services/images';
import { getObject, publicUrl, putObject } from '../server/s3';
import { S3_AWS_S3_BUCKET_NAME } from '../server/config';
import { ORIGINAL_DIR, THUMBS_DIR } from '../util/constants';

// Gives images uploaded before the three-sizes-and-a-placeholder pipeline the
// same treatment new ones get. Two things happen, on different sets of rows:
//
//   THUMBNAILS are only rebuilt where Content.thumb points outside `thumbs/` —
//   a row whose thumbnail is the full-size photo itself, so the grid downloads
//   the whole thing to draw it at 154px. Rebuilding keeps the file the row points at as an untouched `original/`,
//   writes a medium-sized copy over the path the post already uses so no url
//   has to change, and writes a `thumbs/` copy alongside.
//
//   PLACEHOLDERS (Content.lqip) are worked out for every row that has one of
//   our thumbnails, whether or not it needed rebuilding — that's a couple of
//   kilobytes read per row and no writes to the bucket at all.
//
// Only keys under --path (default `/photos/`) are considered at all. The
// pipeline was built for album photography; a link post's favicon gains nothing
// from a rebuild and nothing from a placeholder, and there are a lot of them.
//
// Post bodies are left alone unless --views is passed, which additionally
// rewrites every <img> in them to point at its medium, link to its original,
// and carry its own placeholder. That derives every inline image in the
// database, so it's the slow, expensive pass and it's opt-in.
//
// Idempotent: an image that already has an `original/` is re-derived from it
// rather than from whatever is at the post's url, so a second run is a no-op.
//
//   bun scripts/backfill-images.ts                     # dry run, everyone
//   bun scripts/backfill-images.ts --user mime         # dry run, one author
//   bun scripts/backfill-images.ts --user mime --apply # actually write
//
// Add --limit N while you're finding out whether you like the results.

// Env files are loaded by vite.config.mts, so a script run straight through bun
// gets nothing — and defaulting would silently connect to a local database
// named after $USER. Name the one you mean.
if (!process.env.DATABASE_URL) {
  console.error(`DATABASE_URL is not set, and this script does not read prisma/.env for you.

Point it at a database explicitly, e.g. for local dev:

  DATABASE_URL=postgresql://mime@localhost:5432/helloworld_dev bun scripts/backfill-images.ts

This rewrites post html and overwrites objects in S3, so name the database you mean.`);
  process.exit(1);
}
if (!S3_AWS_S3_BUCKET_NAME) {
  console.error('S3_AWS_S3_BUCKET_NAME is not set. Run with --env-file=.env.production.local, or export it.');
  process.exit(1);
}

// Imported after the guard: server/prisma.ts opens the connection on import.
const { default: prisma } = await import('../server/prisma');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const rewriteViews = args.includes('--views');
const username = args[args.indexOf('--user') + 1];
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : undefined;
// The part of the bucket worth the trouble. Pass --path / to take everything.
const scope = args.includes('--path') ? args[args.indexOf('--path') + 1] : '/photos/';
const inScope = (key: string) => key.includes(scope);

/** The bucket key an <img src> points at, or null if it points somewhere else. */
export function keyFromUrl(src: string): string | null {
  if (!src) return null;
  // Legacy rows store bucket urls as /resource paths; url-factory rewrites them
  // on the way out, and this is the same rewrite in reverse.
  if (src.startsWith('/resource/')) return src.slice('/resource/'.length);
  let url: URL;
  try {
    url = new URL(src, 'https://example.invalid');
  } catch {
    return null;
  }
  const path = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (url.hostname === S3_AWS_S3_BUCKET_NAME) return path;
  // The dev-side form of the same thing: s3.amazonaws.com/<bucket>/<key>.
  if (url.hostname.endsWith('amazonaws.com') && path.startsWith(`${S3_AWS_S3_BUCKET_NAME}/`)) {
    return path.slice(S3_AWS_S3_BUCKET_NAME.length + 1);
  }
  return null;
}

/** Where the untouched file for a key lives, given the key a post points at. */
export function originalKeyFor(key: string): string | null {
  if (key.includes(`/${ORIGINAL_DIR}/`)) return key;
  // A thumbnail is a derivative, never a source: nothing to back-fill from.
  if (key.includes(`/${THUMBS_DIR}/`)) return null;
  const at = key.lastIndexOf('/');
  if (at === -1) return null;
  return `${key.slice(0, at)}/${ORIGINAL_DIR}/${key.slice(at + 1)}`;
}

/** A row's thumbnail key, if that thumbnail is a full-size image needing rebuilt. */
export function fullSizeThumbKey(thumb: string | null): string | null {
  const key = keyFromUrl(thumb || '');
  return key && inScope(key) && !key.includes(`/${THUMBS_DIR}/`) ? key : null;
}

type Derived = {
  original: string;
  medium: string;
  thumb: string;
  lqip: number | null;
  width: number;
  height: number;
  sourceBytes: number;
  thumbBytes: number;
};

const derivedCache = new Map<string, Derived | null>();
let written = 0;

/**
 * Makes sure a key has all three sizes behind it, and says where they are.
 * The first run promotes the file the post points at to `original/`; every run
 * after that derives from the original that's already there.
 */
async function backfillImage(key: string): Promise<Derived | null> {
  if (derivedCache.has(key)) return derivedCache.get(key)!;
  const result = await backfillImageUncached(key);
  derivedCache.set(key, result);
  return result;
}

async function backfillImageUncached(key: string): Promise<Derived | null> {
  const originalKey = originalKeyFor(key);
  if (!originalKey) return null;
  const keys = derivedKeys(originalKey);
  if (!keys) return null;

  // One read, not an existence check and then a read: these are whole photos,
  // and asking twice doubles the egress on every image already backfilled.
  let source = await getObject(originalKey).catch(() => null);
  if (!source && originalKey !== key) {
    // Nothing under original/ yet: whatever the post points at IS the original,
    // so it's copied there before anything overwrites it.
    source = await getObject(key).catch(() => null);
    if (source) {
      console.log(`  promote  ${key} -> ${originalKey}`);
      written++;
      if (apply) {
        await putObject(originalKey, source.bytes, source.contentType || mime.getType(key) || 'image/jpeg');
      }
    }
  }
  if (!source) {
    console.warn(`  missing in the bucket, skipped: ${key}`);
    return null;
  }

  const contentType = source.contentType || mime.getType(originalKey) || 'application/octet-stream';
  if (!contentType.startsWith('image/')) return null;

  const { medium, thumb, lqip } = await deriveImageVariants(source.bytes, contentType);
  console.log(`  derive   ${keys.mediumKey} (${medium.width}x${medium.height}), ${keys.thumbKey}, lqip ${lqip}`);
  written += 2;
  if (apply) {
    await putObject(keys.mediumKey, medium.bytes, medium.contentType);
    await putObject(keys.thumbKey, thumb.bytes, thumb.contentType);
  }

  return {
    original: publicUrl(originalKey),
    medium: publicUrl(keys.mediumKey),
    thumb: publicUrl(keys.thumbKey),
    lqip,
    width: medium.width,
    height: medium.height,
    sourceBytes: source.bytes.byteLength,
    thumbBytes: thumb.bytes.byteLength,
  };
}

/** Rewrites every one of our images in a post body. Returns null if unchanged. */
async function backfillView(view: string): Promise<string | null> {
  if (!view.includes('<img')) return null;
  const $ = cheerio.load(view, null, false);
  let changed = false;

  for (const element of $('img').toArray()) {
    const img = $(element);
    const key = keyFromUrl(img.attr('src') || '');
    if (!key || !inScope(key)) continue;

    const derived = await backfillImage(key);
    if (!derived) continue;

    img.attr('src', derived.medium);
    img.attr('width', String(derived.width));
    img.attr('height', String(derived.height));
    // The placeholder only paints on images the browser is deferring.
    img.attr('loading', 'lazy');
    const style = (img.attr('style') || '').replace(/\s*--lqip:\s*-?\d+;?/g, '').trim();
    if (derived.lqip !== null) {
      img.attr('style', [style.replace(/;$/, ''), `--lqip:${derived.lqip}`].filter(Boolean).join(';'));
    }
    // Clicking through to the full-size file, the way uploads have done since
    // this was first written — unless the image is already inside a link.
    if (!img.parent().is('a')) img.wrap(`<a href="${derived.original}"></a>`);
    changed = true;
  }

  return changed ? $.html() : null;
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)}kb`;

console.log(`bucket: ${S3_AWS_S3_BUCKET_NAME}`);
console.log(`scope: keys containing ${scope}`);
console.log(`rebuilding thumbnails that point outside ${THUMBS_DIR}/; placeholders for every row in scope`);
if (rewriteViews) console.log('--views: post bodies will be rewritten too');
console.log(apply ? 'applying changes\n' : 'DRY RUN — nothing will be written. Pass --apply to commit.\n');

const rows = await prisma.content.findMany({
  // Redirect stubs left behind by a rename have no body of their own.
  where: { ...(username ? { username } : {}), NOT: { redirect: { gt: 0 } } },
  select: { id: true, username: true, name: true, thumb: true, lqip: true, view: true },
  orderBy: { id: 'asc' },
  ...(limit ? { take: limit } : {}),
});

// Which rows are getting a new thumbnail is knowable from their urls alone,
// before a byte is downloaded — so the whole list is said up front rather than
// emerging over the course of a long run, and those rows are done first.
const candidates = new Set(rows.filter((row) => fullSizeThumbKey(row.thumb)).map((row) => row.id));
if (candidates.size) {
  console.log(`${candidates.size} of ${rows.length} rows have a full-size image as their thumbnail:`);
  for (const row of rows) {
    if (candidates.has(row.id)) console.log(`  ${row.username}/${row.name}  ${fullSizeThumbKey(row.thumb)}`);
  }
  console.log('');
} else {
  console.log('no row in scope has a full-size image as its thumbnail; placeholders only.\n');
}

const rebuilt: string[] = [];
let touched = 0;

for (const row of [...rows].sort((a, b) => Number(candidates.has(b.id)) - Number(candidates.has(a.id)))) {
  const label = `${row.username}/${row.name}`;
  const updates: { view?: string; thumb?: string; lqip?: number | null } = {};

  if (rewriteViews) {
    const view = await backfillView(row.view || '').catch((error) => {
      console.error(`  ${label}: ${error.message}`);
      return null;
    });
    if (view) updates.view = view;
  }

  const thumbKey = keyFromUrl(row.thumb || '');
  if (thumbKey && inScope(thumbKey)) {
    // Rebuilding hands back the placeholder as a side effect. A row that
    // already has a real thumbnail just needs that placeholder, if it hasn't
    // got one yet — a couple of kilobytes read, and nothing written.
    const isFullSize = candidates.has(row.id);
    const derived = isFullSize ? await backfillImage(thumbKey) : null;

    if (derived) {
      console.log(`  thumbnail was the full-size image, ${kb(derived.sourceBytes)} -> ${kb(derived.thumbBytes)}`);
      rebuilt.push(`${label}  ${kb(derived.sourceBytes)} -> ${kb(derived.thumbBytes)}  ${thumbKey}`);
      if (row.thumb !== derived.thumb) updates.thumb = derived.thumb;
      if (row.lqip !== derived.lqip) updates.lqip = derived.lqip;
    } else if (!isFullSize && row.lqip === null) {
      const bytes = await getObject(thumbKey).then(
        (object) => object.bytes,
        () => {
          console.warn(`  ${label}: thumbnail missing in the bucket: ${thumbKey}`);
          return null;
        }
      );
      const lqip = bytes && (await computeLqip(bytes).catch(() => null));
      if (lqip != null) updates.lqip = lqip;
    }
  }

  if (!Object.keys(updates).length) continue;
  touched++;
  console.log(`${label}: ${Object.keys(updates).join(', ')}`);
  if (apply) await prisma.content.update({ where: { id: row.id }, data: updates });
}

function report(title: string, entries: string[]) {
  if (!entries.length) return;
  console.log(`\n${title} (${entries.length}):`);
  for (const entry of entries) console.log(`  ${entry}`);
}

report('thumbnails that were a full-size image', rebuilt);

console.log(
  `\n${apply ? 'updated' : 'would update'} ${touched} of ${rows.length} rows, ` +
    `${apply ? 'wrote' : 'would write'} ${written} objects to S3.`
);
if (!apply) console.log('Nothing was changed. Re-run with --apply.');
process.exit(0);
