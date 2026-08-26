import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { ReactRenderer } from '@tiptap/react';
import { emojis, type EmojiItem } from '@tiptap/extension-emoji';
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import styles from './editor.module.css';

const MAX_ITEMS = 8;

// Every emoji in the set has a unicode character, and the fallback images point
// at a third-party CDN. Dropping them keeps saved posts to plain unicode rather
// than baking a remote <img> into the HTML whenever the authoring browser's
// support probe says no — which also keeps the emoji in getText(), so it still
// reaches feeds and search.
export const unicodeEmojis: EmojiItem[] = emojis.map((item) => ({ ...item, fallbackImage: undefined }));

type EmojiListProps = {
  items: EmojiItem[];
  command: (item: { name: string }) => void;
};

type EmojiListHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

const EmojiList = forwardRef<EmojiListHandle, EmojiListProps>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  const pick = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) command({ name: item.name });
    },
    [items, command]
  );

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }) => {
        if (!items.length) return false;
        if (event.key === 'ArrowUp') {
          setSelected((current) => (current + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelected((current) => (current + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          pick(selected);
          return true;
        }
        return false;
      },
    }),
    [items, selected, pick]
  );

  if (!items.length) return null;

  return (
    <div className={styles.emojiList} role="listbox" aria-label="emoji">
      {items.map((item, index) => (
        <button
          type="button"
          role="option"
          aria-selected={index === selected}
          key={item.name}
          className={index === selected ? styles.emojiItemSelected : undefined}
          // Mousedown would blur the editor and tear the suggestion down before
          // the click ever lands.
          onMouseDown={(evt) => evt.preventDefault()}
          onMouseEnter={() => setSelected(index)}
          onClick={() => pick(index)}
        >
          <span className={styles.emojiGlyph} aria-hidden="true">
            {item.emoji}
          </span>
          :{item.name}:
        </button>
      ))}
    </div>
  );
});

EmojiList.displayName = 'EmojiList';

export function matchEmojis(all: EmojiItem[], query: string) {
  const needle = query.toLowerCase();
  if (!needle) return all.slice(0, MAX_ITEMS);

  // Shortcode matches are what people mean by `:tada`; tags only broaden the net
  // once those run out. Exact beats prefix beats substring, so typing the whole
  // of `:smile` doesn't hand you `smiley` just because it sorts earlier.
  const rank = (item: EmojiItem) => {
    if (item.shortcodes.some((code) => code === needle)) return 0;
    if (item.shortcodes.some((code) => code.startsWith(needle))) return 1;
    if (item.shortcodes.some((code) => code.includes(needle))) return 2;
    if (item.tags.some((tag) => tag.startsWith(needle))) return 3;
    return 4;
  };

  return all
    .map((item) => ({ item, score: rank(item) }))
    .filter(({ score }) => score < 4)
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_ITEMS)
    .map(({ item }) => item);
}

export const emojiSuggestion: Partial<SuggestionOptions<EmojiItem, { name: string }>> = {
  items: ({ editor, query }) => matchEmojis(editor.storage.emoji.emojis as EmojiItem[], query),

  render: () => {
    let renderer: ReactRenderer<EmojiListHandle, EmojiListProps> | null = null;
    let unmount: (() => void) | null = null;

    return {
      onStart: (props: SuggestionProps<EmojiItem, { name: string }>) => {
        renderer = new ReactRenderer(EmojiList, { props, editor: props.editor });
        // The plugin owns positioning: it anchors the element to the caret and
        // keeps it there through scrolls and resizes.
        unmount = props.mount(renderer.element);
      },

      onUpdate: (props: SuggestionProps<EmojiItem, { name: string }>) => {
        renderer?.updateProps(props);
      },

      // Escape is handled by the suggestion plugin itself, which exits and
      // triggers onExit below.
      onKeyDown: (props: SuggestionKeyDownProps) => renderer?.ref?.onKeyDown(props) ?? false,

      onExit: () => {
        unmount?.();
        renderer?.destroy();
        unmount = null;
        renderer = null;
      },
    };
  },
};
