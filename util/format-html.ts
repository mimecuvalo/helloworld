// Tiptap's `getHTML()` serializes a document to a single line — no whitespace at
// all between block elements — so anything written in the wysiwyg turned the HTML
// tab into one unreadable run, and hand-formatting done in that tab was wiped as
// soon as the content tab round-tripped the document again. Formatting on save
// leaves both views legible.
//
// Hand-rolled rather than parse-and-reserialize: what gets stored is rendered
// verbatim into the SSR markup, and its inline scripts are hashed byte-for-byte
// for the CSP (see server/content-csp.ts), so anything this doesn't understand has
// to come through exactly as it arrived.

// Breaks only ever go around these. Everything else — <em>, <a>, <img>, <br> — is
// inline, where a newline is rendered as a space the author never typed.
const BLOCK_ELEMENTS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'caption',
  'colgroup',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);

// Copied through untouched: inside these, whitespace is content rather than
// formatting, and reindenting a <pre> or a <script> changes what it means.
const VERBATIM_ELEMENTS = ['pre', 'script', 'style', 'textarea'];

// No close tag to match, so they must not open a level of indentation.
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<(\/?)([a-zA-Z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g;

export function formatHTML(html: string): string {
  if (!html.trim()) return '';

  const lines: string[] = [];
  let depth = 0;
  let line = '';
  // Where the open line began: a line that starts inside two lists and ends after
  // its own children have closed still belongs at the depth it opened at.
  let lineDepth = 0;
  // True between a block's open tag and its first content, so that whitespace left
  // behind by the author's own indentation doesn't come through as a leading space.
  let atBlockStart = false;

  const add = (text: string) => {
    if (!line) lineDepth = depth;
    line += text;
  };
  const flush = () => {
    if (line.trim()) lines.push('  '.repeat(lineDepth) + line.trim());
    line = '';
  };

  const addText = (raw: string) => {
    if (!raw) return;
    // Runs of whitespace already render as a single space, so collapsing them is
    // not a change to the document — only <pre>, taken verbatim below, would tell
    // the difference.
    let text = raw.replace(/[ \t\r\n]+/g, ' ');
    if (atBlockStart || !line) text = text.replace(/^ /, '');
    if (!text) return;
    add(text);
    atBlockStart = false;
  };

  let last = 0;
  let match: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((match = TOKEN.exec(html))) {
    addText(html.slice(last, match.index));
    last = TOKEN.lastIndex;

    const [tag, slash, rawName] = match;
    // A comment or a doctype: nothing to indent around, so it rides the line.
    if (rawName === undefined) {
      add(tag);
      atBlockStart = false;
      continue;
    }
    const name = rawName.toLowerCase();

    if (!slash && VERBATIM_ELEMENTS.includes(name)) {
      const close = new RegExp(`</${name}\\s*>`, 'i');
      const rest = html.slice(match.index);
      const end = close.exec(rest);
      // An unclosed <pre> means the rest of the document is its content; taking it
      // whole looks wrong but is lossless, which is the trade this file makes.
      const raw = end ? rest.slice(0, end.index + end[0].length) : rest;
      flush();
      lines.push('  '.repeat(depth) + raw);
      TOKEN.lastIndex = last = match.index + raw.length;
      atBlockStart = false;
      continue;
    }

    if (!BLOCK_ELEMENTS.has(name)) {
      add(tag);
      atBlockStart = false;
      continue;
    }

    if (slash) {
      depth = Math.max(0, depth - 1);
      // Closing onto an open line keeps short blocks whole — `<p>text</p>`, and
      // `<p></p>`, which has to stay exactly that for the `p:empty` rule in
      // content-theme.css to give a blank line its height.
      if (line) {
        line = line.replace(/ $/, '') + tag;
      } else {
        lineDepth = depth;
        line = tag;
      }
      flush();
    } else {
      flush();
      add(tag);
      if (!VOID_ELEMENTS.has(name)) depth += 1;
      atBlockStart = true;
    }
  }
  addText(html.slice(last));
  flush();

  return lines.join('\n');
}
