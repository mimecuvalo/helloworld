import { mergeAttributes } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import { Image } from '@tiptap/extension-image';
import { isLqip } from 'lib/lqip';

// The <img> an element stands for: itself, or the one a <figure> or link wraps.
function imageOf(element: HTMLElement) {
  return element.tagName === 'IMG' ? element : element.querySelector('img');
}

// The link an image is wrapped in — but only when the image is all it holds.
// An <a> with an icon and a label beside it is a link with an image in it, and
// swallowing it whole would throw the label away.
function linkOf(element: HTMLElement): HTMLAnchorElement | null {
  const anchor = element.tagName === 'A' ? (element as HTMLAnchorElement) : element.querySelector('a');
  if (!anchor || !anchor.getAttribute('href')) return null;
  const onlyChild = anchor.children.length === 1 && anchor.children[0].tagName === 'IMG';
  return onlyChild && !anchor.textContent?.trim() ? anchor : null;
}

// An image carries its caption as an attribute rather than as editable content:
// the node stays a leaf — so ProseMirror marks its dom uneditable and the
// caption can't be typed into by accident — and the toolbar writes it instead.
// Captioned images serialize as <figure><img><figcaption>, which is the markup
// the rest of the site already styles.
//
// An uploaded image also carries two things the upload worked out for it: the
// url of the untouched original it was resized from, which it links to, and the
// placeholder that stands in for it while it loads (see lib/lqip.ts).
export default Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      // A <figure> or a link stands in for the image it wraps, so everything
      // that lives on the <img> has to be read back through the wrapper too.
      src: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('src') },
      alt: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('alt') },
      title: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('title') },
      // Intrinsic size isn't decoration: without it the browser has no box to
      // reserve, so the placeholder has nothing to paint in and the page jumps
      // when the image lands.
      width: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('width') },
      height: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('height') },
      // Images in a post are below the fold far more often than not, and the
      // placeholder only applies to images the browser is deferring.
      loading: {
        default: 'lazy',
        parseHTML: (element) => imageOf(element)?.getAttribute('loading') || 'lazy',
      },
      caption: {
        default: null,
        parseHTML: (element) => element.querySelector('figcaption')?.textContent || null,
        // The caption is the <figcaption>; it's never an attribute of the <img>.
        renderHTML: () => ({}),
      },
      original: {
        default: null,
        parseHTML: (element) => linkOf(element)?.getAttribute('href') || null,
        // The original is the <a> around the image, not an attribute of it.
        renderHTML: () => ({}),
      },
      lqip: {
        default: null,
        parseHTML: (element) => {
          // An unset custom property reads back as '', and Number('') is 0 —
          // a perfectly valid placeholder, so the empty case has to go first.
          const raw = imageOf(element)?.style.getPropertyValue('--lqip').trim();
          return raw && isLqip(Number(raw)) ? Number(raw) : null;
        },
        renderHTML: (attributes) => (isLqip(attributes.lqip) ? { style: `--lqip:${attributes.lqip}` } : {}),
      },
    };
  },

  parseHTML() {
    return [
      // Ahead of the bare <img> rule: a figure has to be claimed whole, or its
      // caption is left behind as loose text next to the image.
      { tag: 'figure', getAttrs: (element) => (imageOf(element as HTMLElement) ? {} : false) },
      // Likewise a link around nothing but an image — that's an image that
      // knows where its original lives, not a link that happens to have one.
      { tag: 'a', getAttrs: (element) => (linkOf(element as HTMLElement) ? {} : false) },
      ...(this.parent?.() || []),
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    let out: DOMOutputSpec = ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    if (node.attrs.original) out = ['a', { href: node.attrs.original }, out];
    if (!node.attrs.caption) return out;
    return ['figure', {}, out, ['figcaption', {}, node.attrs.caption]];
  },
});
