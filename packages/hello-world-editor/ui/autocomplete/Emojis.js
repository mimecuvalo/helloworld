import createEmojiPlugin from 'draft-js-emoji-plugin';
import styles from './Emojis.module.css';

export const emojiPlugin = createEmojiPlugin({
  theme: styles,
});
const { EmojiSuggestions } = emojiPlugin;

export default EmojiSuggestions;
