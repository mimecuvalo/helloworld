import * as cbor from '@ipld/dag-cbor';
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import type { Content, User } from '../../generated/prisma/client';
import { contentUrl } from '../../lib/url-factory';
import { entryContentHtml, plainTextExcerpt } from './xml';

// Mapping local Content onto AT Protocol records.
//
// A blog post becomes an app.bsky.feed.post whose text is the title plus an
// excerpt (the lexicon caps text at 300 graphemes) with the permalink carried
// in an external embed, which is how a link keeps its card on Bluesky.

export const POST_COLLECTION = 'app.bsky.feed.post';

// The lexicon limit is 300 graphemes; leave room for the ellipsis.
const MAX_POST_GRAPHEMES = 300;

function graphemes(text: string): string[] {
  // Intl.Segmenter is what the atproto spec means by "grapheme"; every runtime
  // this ships on has it.
  return [...new Intl.Segmenter().segment(text)].map((segment) => segment.segment);
}

export function truncateToGraphemes(text: string, max = MAX_POST_GRAPHEMES): string {
  const segments = graphemes(text);
  if (segments.length <= max) return text;
  return `${segments
    .slice(0, max - 1)
    .join('')
    .trimEnd()}…`;
}

export function postTextFor(content: Content): string {
  const excerpt = plainTextExcerpt(content.view, MAX_POST_GRAPHEMES);
  const title = content.title?.trim();
  // A comment has no title of its own; a post leads with one.
  const text = title && content.section !== 'comments' ? `${title}\n\n${excerpt}` : excerpt;
  return truncateToGraphemes(text.trim());
}

// Record keys for app.bsky.feed.post must be TIDs — 13 characters of
// base32-sortable encoding a timestamp — not arbitrary slugs. The PDS rejects
// anything else outright ("Invalid TID string"), so a post's `name` cannot be
// used directly however convenient that would be.
const TID_ALPHABET = '234567abcdefghijklmnopqrstuvwxyz';

export function encodeTid(microseconds: bigint, clockId: number): string {
  // 64 bits: a leading 0, 53 bits of timestamp, 10 bits of clock id.
  const value = ((microseconds & 0x1fffffffffffffn) << 10n) | BigInt(clockId & 0x3ff);
  let out = '';
  for (let i = 12; i >= 0; i--) {
    out += TID_ALPHABET[Number((value >> BigInt(i * 5)) & 0x1fn)];
  }
  return out;
}

// Derived from the post's own id and creation time, so it is stable: the same
// post always maps to the same record, which is what makes putRecord replace an
// edit instead of duplicating it.
export function rkeyFor(content: Content): string {
  const createdAt = new Date(content.createdAt || 0).getTime();
  return encodeTid(BigInt(createdAt) * 1000n, content.id % 1024);
}

export function atUriFor(did: string, content: Content): string {
  return `at://${did}/${POST_COLLECTION}/${rkeyFor(content)}`;
}

// A blob ref returned by com.atproto.repo.uploadBlob.
export type BlobRef = unknown;

export function buildPostRecord(
  host: string,
  content: Content,
  contentOwner: User,
  options: { thumbBlob?: BlobRef; imageBlobs?: { blob: BlobRef; alt: string }[]; reply?: unknown } = {}
): Record<string, unknown> {
  const permalink = contentUrl(content, undefined, host);
  const { thumbBlob, imageBlobs, reply } = options;

  // Images the post actually carries beat a link card: they render inline on
  // Bluesky instead of collapsing to a one-line preview.
  const embed = imageBlobs?.length
    ? {
        $type: 'app.bsky.embed.images',
        images: imageBlobs.slice(0, 4).map(({ blob, alt }) => ({ image: blob, alt })),
      }
    : {
        $type: 'app.bsky.embed.external',
        external: {
          uri: permalink,
          title: content.title || contentOwner.title,
          description: plainTextExcerpt(content.view, 300),
          // Without a thumb blob the link card renders as bare text.
          ...(thumbBlob ? { thumb: thumbBlob } : {}),
        },
      };

  return {
    $type: POST_COLLECTION,
    text: postTextFor(content),
    createdAt: new Date(content.createdAt || Date.now()).toISOString(),
    langs: ['en'],
    embed,
    ...(reply ? { reply } : {}),
  };
}

// Every <img> in a post body, absolute-ised, so they can be uploaded as blobs.
export function imageUrlsIn(host: string, content: Content): string[] {
  const urls = new Set<string>();
  const html = entryContentHtml(host, content);

  for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1];
    // Skip the analytics pixel entryContentHtml appends.
    if (!src || src.includes('/api/stats')) continue;
    if (/^https?:\/\//i.test(src)) urls.add(src);
  }

  return [...urls];
}

// A real CIDv1 over the dag-cbor encoding of the record, which is what atproto
// specifies — not a placeholder, so a client that verifies it will agree.
export async function cidForRecord(record: Record<string, unknown>): Promise<string> {
  const encoded = cbor.encode(record);
  // Past a size threshold dag-cbor hands back a pooled Node Buffer, and
  // multiformats gates on `instanceof Uint8Array` — which a Buffer from another
  // realm fails. Copy into a plain view so the hash never depends on that.
  const bytes = new Uint8Array(encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength));
  const hash = await sha256.digest(bytes);
  return CID.createV1(cbor.code, hash).toString();
}

export type AtprotoRecord = { uri: string; cid: string; value: Record<string, unknown> };

export async function recordFor(
  host: string,
  did: string,
  content: Content,
  contentOwner: User
): Promise<AtprotoRecord> {
  const value = buildPostRecord(host, content, contentOwner);
  return { uri: atUriFor(did, content), cid: await cidForRecord(value), value };
}

// --- reading records back --------------------------------------------------

export function rkeyOfUri(uri: string): string {
  return uri.split('/').pop() || '';
}

// The inverse of bskyPermalink: a bsky.app URL back to the at:// uri, given a
// way to resolve the handle to a DID. Returns null for anything else.
export async function atUriFromBskyUrl(
  url: string,
  resolveHandle: (handle: string) => Promise<string | null>
): Promise<string | null> {
  if (url.startsWith('at://')) return url;

  const match = url.match(/^https?:\/\/(?:www\.)?bsky\.app\/profile\/([^/]+)\/post\/([^/?#]+)/i);
  if (!match) return null;

  const [, actor, rkey] = match;
  const did = actor.startsWith('did:') ? actor : await resolveHandle(decodeURIComponent(actor));
  return did ? `at://${did}/${POST_COLLECTION}/${rkey}` : null;
}

export function bskyPermalink(handle: string, uri: string): string {
  return `https://bsky.app/profile/${handle}/post/${rkeyOfUri(uri)}`;
}

// --- embeds ------------------------------------------------------------------

// The view shapes a feed response actually returns. Images and video carry
// pre-generated thumbnails, so nothing here has to fetch a blob.
type EmbedView = {
  $type?: string;
  images?: { thumb?: string; fullsize?: string; alt?: string }[];
  external?: { uri?: string; title?: string; description?: string; thumb?: string };
  playlist?: string;
  thumbnail?: string;
  alt?: string;
  // Quote posts nest the quoted record, and recordWithMedia nests both.
  record?: {
    uri?: string;
    value?: { text?: string };
    author?: { handle?: string; displayName?: string };
    record?: { uri?: string; value?: { text?: string }; author?: { handle?: string; displayName?: string } };
  };
  media?: EmbedView;
};

// Renders a post's embed to HTML for the reader. Without this an image post
// from someone you follow arrives as bare text with the picture missing.
export function renderEmbed(embed: EmbedView | undefined | null): string {
  if (!embed) return '';
  const type = embed.$type || '';

  if (embed.images?.length) {
    return embed.images
      .map((image) => {
        const src = image.thumb || image.fullsize || '';
        if (!src) return '';
        const img = `<img src="${escapeHtml(src)}" alt="${escapeHtml(image.alt || '')}" />`;
        return image.fullsize
          ? `<p><a href="${escapeHtml(image.fullsize)}" rel="noopener noreferrer">${img}</a></p>`
          : `<p>${img}</p>`;
      })
      .join('');
  }

  if (embed.external?.uri) {
    const { uri, title, description, thumb } = embed.external;
    const image = thumb ? `<img src="${escapeHtml(thumb)}" alt="" />` : '';
    return (
      `<p><a href="${escapeHtml(uri)}" rel="noopener noreferrer">${image}` +
      `<strong>${escapeHtml(title || uri)}</strong></a>` +
      (description ? `<br />${escapeHtml(description)}` : '') +
      `</p>`
    );
  }

  if (type.startsWith('app.bsky.embed.video')) {
    const poster = embed.thumbnail ? ` poster="${escapeHtml(embed.thumbnail)}"` : '';
    return embed.playlist
      ? `<p><video controls${poster} src="${escapeHtml(embed.playlist)}"></video></p>`
      : embed.thumbnail
        ? `<p><img src="${escapeHtml(embed.thumbnail)}" alt="${escapeHtml(embed.alt || '')}" /></p>`
        : '';
  }

  // recordWithMedia carries both halves; render the media then the quote.
  if (embed.media) return renderEmbed(embed.media) + renderEmbed({ ...embed, media: undefined });

  const quoted = embed.record?.record || embed.record;
  if (quoted?.value?.text) {
    const who = quoted.author?.displayName || quoted.author?.handle || '';
    const link = quoted.uri ? bskyPermalink(quoted.author?.handle || '', quoted.uri) : '';
    const attribution = link
      ? `<a href="${escapeHtml(link)}" rel="noopener noreferrer">${escapeHtml(who)}</a>`
      : escapeHtml(who);
    return `<blockquote>${attribution ? `<cite>${attribution}</cite> ` : ''}${escapeHtml(quoted.value.text)}</blockquote>`;
  }

  return '';
}

type Facet = {
  index: { byteStart: number; byteEnd: number };
  features: { $type: string; uri?: string; did?: string; tag?: string }[];
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Renders a post's text plus its facets to HTML for the reader.
//
// Facet offsets are byte offsets into the UTF-8 encoding, not string indices —
// slicing the JS string directly would corrupt anything past the first
// non-ASCII character.
export function renderPostText(text: string, facets: Facet[] = []): string {
  const bytes = Buffer.from(text, 'utf8');
  const ordered = [...(facets || [])]
    .filter((facet) => facet?.index && facet.features?.length)
    .sort((a, b) => a.index.byteStart - b.index.byteStart);

  let html = '';
  let cursor = 0;
  for (const facet of ordered) {
    const { byteStart, byteEnd } = facet.index;
    if (byteStart < cursor || byteEnd > bytes.length) continue;

    html += escapeHtml(bytes.subarray(cursor, byteStart).toString('utf8'));
    const label = escapeHtml(bytes.subarray(byteStart, byteEnd).toString('utf8'));
    const feature = facet.features[0];

    if (feature.$type?.endsWith('#link') && feature.uri) {
      html += `<a href="${escapeHtml(feature.uri)}" rel="noopener noreferrer">${label}</a>`;
    } else if (feature.$type?.endsWith('#mention') && feature.did) {
      html += `<a href="https://bsky.app/profile/${escapeHtml(feature.did)}">${label}</a>`;
    } else if (feature.$type?.endsWith('#tag') && feature.tag) {
      html += `<a href="https://bsky.app/hashtag/${encodeURIComponent(feature.tag)}">${label}</a>`;
    } else {
      html += label;
    }
    cursor = byteEnd;
  }
  html += escapeHtml(bytes.subarray(cursor).toString('utf8'));

  return `<p>${html.replace(/\n/g, '<br />')}</p>`;
}
