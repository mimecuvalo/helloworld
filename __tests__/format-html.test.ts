import { describe, expect, test } from 'vitest';
import { formatHTML } from 'util/format-html';

describe('formatHTML', () => {
  test('breaks between block elements', () => {
    expect(formatHTML('<p>one</p><p>two</p>')).toBe('<p>one</p>\n<p>two</p>');
  });

  test('indents nested blocks', () => {
    expect(formatHTML('<ul><li>a</li><li>b</li></ul>')).toBe('<ul>\n  <li>a</li>\n  <li>b</li>\n</ul>');
  });

  test('leaves an empty paragraph exactly as it found it', () => {
    // content-theme.css gives a blank line its height with `p:empty`, which stops
    // matching the moment anything — even a newline — lands between the tags.
    expect(formatHTML('<p>a</p><p></p><p>b</p>')).toBe('<p>a</p>\n<p></p>\n<p>b</p>');
  });

  test('keeps inline content on one line', () => {
    const html = '<p>hello <em>there</em> <a href="/x">you</a><br>again</p>';
    expect(formatHTML(html)).toBe(html);
  });

  test('never inserts whitespace between adjacent inline elements', () => {
    // A newline here would render as a space that the author did not type.
    expect(formatHTML('<p><em>a</em><strong>b</strong></p>')).toBe('<p><em>a</em><strong>b</strong></p>');
  });

  test('preserves a real space between inline elements', () => {
    expect(formatHTML('<p><em>a</em> <strong>b</strong></p>')).toBe('<p><em>a</em> <strong>b</strong></p>');
  });

  test('leaves pre contents untouched', () => {
    const html = '<p>x</p><pre><code>if (a) {\n    b();\n}</code></pre>';
    expect(formatHTML(html)).toBe('<p>x</p>\n<pre><code>if (a) {\n    b();\n}</code></pre>');
  });

  test('leaves script bytes untouched so the CSP hash still matches', () => {
    const body = 'const a = 1;\n    const b = 2;';
    const out = formatHTML(`<div><script>${body}</script></div>`);
    expect(out).toContain(`<script>${body}</script>`);
  });

  test('does not indent void elements', () => {
    expect(formatHTML('<div><hr><p>a</p></div>')).toBe('<div>\n  <hr>\n  <p>a</p>\n</div>');
  });

  test('keeps attributes containing angle brackets intact', () => {
    const html = '<p><a href="/a?b=1&amp;c=2" title="a > b">x</a></p>';
    expect(formatHTML(html)).toBe(html);
  });

  test('handles figure/figcaption as the editor emits it', () => {
    // <img> stays inline, so it rides the figure's line rather than getting a
    // break of its own: breaking before an inline element is only safe when
    // something already separates it from its neighbour, and here nothing does.
    const html = '<figure><img src="/a.jpg" alt=""><figcaption>hi</figcaption></figure>';
    expect(formatHTML(html)).toBe('<figure><img src="/a.jpg" alt="">\n  <figcaption>hi</figcaption>\n</figure>');
  });

  test('does not add a space around an image sitting in a sentence', () => {
    expect(formatHTML('<p>before<img src="/a.jpg">after</p>')).toBe('<p>before<img src="/a.jpg">after</p>');
  });

  test('is idempotent', () => {
    const inputs = [
      '<p>one</p><p></p><ul><li>a<ul><li>b</li></ul></li></ul>',
      '<figure><img src="/a.jpg"><figcaption>c</figcaption></figure>',
      '<p>x</p><pre>  keep\n   me</pre><p>y</p>',
      '<blockquote><p>q</p></blockquote><hr><h1>T</h1>',
    ];
    for (const input of inputs) {
      const once = formatHTML(input);
      expect(formatHTML(once)).toBe(once);
    }
  });

  test('reformatting already-indented html does not accumulate whitespace', () => {
    expect(formatHTML('<div>\n  <p>\n    hello\n  </p>\n</div>')).toBe('<div>\n  <p>hello</p>\n</div>');
  });

  test('drops nothing when there is no markup', () => {
    expect(formatHTML('just words')).toBe('just words');
    expect(formatHTML('')).toBe('');
    expect(formatHTML('   ')).toBe('');
  });

  test('passes comments through', () => {
    expect(formatHTML('<p>a</p><!-- note --><p>b</p>')).toBe('<p>a</p>\n<!-- note -->\n<p>b</p>');
    // Inside a block it stays where the author put it, rather than being hoisted
    // onto a line of its own and picking up a space on either side.
    expect(formatHTML('<p>a<!-- note -->b</p>')).toBe('<p>a<!-- note -->b</p>');
  });

  test('survives stray close tags without losing content', () => {
    expect(formatHTML('</p><p>a</p>')).toBe('</p>\n<p>a</p>');
  });
});
