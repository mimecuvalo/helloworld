import type { Content } from '../../generated/prisma/client';
import { buildUrl, contentUrl } from '../../lib/url-factory';

export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function attrs(o: Record<string, unknown>): string {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join('');
}

// RSS 2.0 dates are RFC-822; Date#toUTCString emits the RFC-1123 form, which is
// the profile RSS readers expect. (Atom uses ISO-8601 instead — see feed-xml.)
export function rfc822(date: Date | string | null | undefined): string {
  return new Date(date || '').toUTCString();
}

// The syndicated body of a piece of content: relative /resource paths made
// absolute (they're really S3-backed) plus the stats tracking pixel. Shared so
// the Atom and RSS renderings of a post stay byte-identical.
export function entryContentHtml(host: string, content: Content): string {
  const statsImgSrc = buildUrl({
    host,
    pathname: '/api/stats',
    searchParams: { resource: contentUrl(content, undefined, host) },
  });
  const absoluteUrlReplacement = buildUrl({ host, pathname: '/resource' });
  return content.view.replace(/(['"])\/resource/gm, `$1${absoluteUrlReplacement}`) + `<img src="${statsImgSrc}" />`;
}

// A short plain-text summary for RSS <description>, which is not guaranteed to
// be rendered as HTML by every reader.
export function plainTextExcerpt(html: string, maxLength = 300): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
