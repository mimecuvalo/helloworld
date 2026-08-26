import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Emoji } from '@tiptap/extension-emoji';
import { emojiSuggestion, matchEmojis, unicodeEmojis } from 'components/editor/EmojiSuggestion';

const names = (query: string) => matchEmojis(unicodeEmojis, query).map((item) => item.name);

describe('matchEmojis', () => {
  it('ranks shortcode prefixes ahead of tag matches', () => {
    expect(names('tada')[0]).toBe('tada');
  });

  it('matches shortcodes that are not plain words', () => {
    expect(names('+1')).toContain('+1');
  });

  it('prefers an exact shortcode over a longer one that merely starts with it', () => {
    // Both `smile` and `smiley` match the prefix; the exact one has to win.
    expect(names('smile')[0]).toBe('smile');
    expect(names('smile')).toContain('smiley');
  });

  it('falls back to tags when no shortcode matches', () => {
    expect(names('lol').length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    expect(names('TADA')).toEqual(names('tada'));
  });

  it('caps the list and returns something for an empty query', () => {
    expect(matchEmojis(unicodeEmojis, '')).toHaveLength(8);
    expect(matchEmojis(unicodeEmojis, 'smi').length).toBeLessThanOrEqual(8);
  });

  it('returns nothing for gibberish', () => {
    expect(names('zzzzqqqq')).toEqual([]);
  });
});

describe('emoji serialization', () => {
  const makeEditor = (content: string) =>
    new Editor({
      extensions: [StarterKit, Emoji.configure({ emojis: unicodeEmojis, suggestion: emojiSuggestion })],
      content,
    });

  it('round-trips through saved HTML', () => {
    const editor = makeEditor('<p>hi</p>');
    editor.commands.setEmoji('tada');
    const html = editor.getHTML();
    editor.destroy();

    // The unicode character sits inside the span, so the emoji survives even
    // where a feed reader strips the wrapper.
    expect(html).toContain('data-type="emoji"');
    expect(html).toContain('data-name="tada"');
    expect(html).toContain('🎉');

    const reloaded = makeEditor(html);
    expect(reloaded.getJSON().content?.[0].content?.some((node) => node.type === 'emoji')).toBe(true);
    expect(reloaded.getHTML()).toBe(html);
    reloaded.destroy();
  });

  it('keeps the emoji as text for feeds and search', () => {
    const editor = makeEditor('<p>hi</p>');
    editor.commands.setEmoji('tada');
    expect(editor.getText()).toContain('🎉');
    editor.destroy();
  });
});
