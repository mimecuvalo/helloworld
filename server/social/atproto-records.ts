import * as cbor from '@ipld/dag-cbor';
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import type { Content, User } from '../../generated/prisma/client';
import { contentUrl } from '../../lib/url-factory';
import { plainTextExcerpt } from './xml';

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

// The record key. Content.name is already unique per user and URL-safe, and
// reusing it means a post maps to the same rkey every time.
export function rkeyFor(content: Content): string {
  return content.name;
}

export function atUriFor(did: string, content: Content): string {
  return `at://${did}/${POST_COLLECTION}/${rkeyFor(content)}`;
}

export function buildPostRecord(host: string, content: Content, contentOwner: User): Record<string, unknown> {
  const permalink = contentUrl(content, undefined, host);

  return {
    $type: POST_COLLECTION,
    text: postTextFor(content),
    createdAt: new Date(content.createdAt || Date.now()).toISOString(),
    langs: ['en'],
    embed: {
      $type: 'app.bsky.embed.external',
      external: {
        uri: permalink,
        title: content.title || contentOwner.title,
        description: plainTextExcerpt(content.view, 300),
      },
    },
  };
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

export function bskyPermalink(handle: string, uri: string): string {
  return `https://bsky.app/profile/${handle}/post/${rkeyOfUri(uri)}`;
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
