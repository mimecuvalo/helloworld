import { mergeAttributes } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import { Image } from '@tiptap/extension-image';

// The <img> an element stands for: itself, or the one a <figure> wraps.
function imageOf(element: HTMLElement) {
  return element.tagName === 'IMG' ? element : element.querySelector('img');
}

// An image carries its caption as an attribute rather than as editable content:
// the node stays a leaf — so ProseMirror marks its dom uneditable and the
// caption can't be typed into by accident — and the toolbar writes it instead.
// Captioned images serialize as <figure><img><figcaption>, which is the markup
// the rest of the site already styles.
export default Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      // A <figure> stands in for the image it wraps, so everything that lives on
      // the <img> has to be read back through the wrapper too.
      src: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('src') },
      alt: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('alt') },
      title: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('title') },
      width: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('width') },
      height: { default: null, parseHTML: (element) => imageOf(element)?.getAttribute('height') },
      caption: {
        default: null,
        parseHTML: (element) => element.querySelector('figcaption')?.textContent || null,
        // The caption is the <figcaption>; it's never an attribute of the <img>.
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      // Ahead of the bare <img> rule: a figure has to be claimed whole, or its
      // caption is left behind as loose text next to the image.
      { tag: 'figure', getAttrs: (element) => (imageOf(element as HTMLElement) ? {} : false) },
      ...(this.parent?.() || []),
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const image: DOMOutputSpec = ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    if (!node.attrs.caption) return image;
    return ['figure', {}, image, ['figcaption', {}, node.attrs.caption]];
  },
});
