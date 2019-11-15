import createEmojiPlugin from 'draft-js-emoji-plugin';

const emojiButtonStyles = {
  margin: '0',
  padding: '0',
  width: '2.5em',
  height: '1.5em',
  boxSizing: 'border-box',
  lineHeight: '1.2em',
  fontSize: '1.5em',
  color: '#888',
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: '1.5em',
  cursor: 'pointer',
  '&:focus': {
    outline: '0'
  },
  '&:hover': {
    background: '#f3f3f3'
  },
  '&:active': {
    background: '#e6e6e6'
  },
};

const navEntryStyles = {
  padding: '0',
  width: '100%',
  height: '100%',
  fontSize: '1.2em',
  color: '#bdbdbd',
  background: 'none',
  border: 'none',
  outline: 'none'
};

const entryStyles = {
  padding: '0',
  width: '100%',
  height: '100%',
  background: 'none',
  border: 'none',
  outline: 'none',
  transition: 'background-color 0.4s cubic-bezier(0.27, 1.27, 0.48, 0.56)'
};

const styles = {
  emoji: {
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    verticalAlign: 'middle',
    display: 'inline-block',
    overflow: 'hidden',
    maxWidth: '1.95ch',
    maxHeight: '1em',
    lineHeight: 'inherit',
    margin: '-0.2ex 0em 0.2ex',
    color: 'transparent',
    minWidth: '1em'
  },
  emojiSuggestionsEntry: {
    padding: '5px 10px 1px 10px',
    transition: 'background-color 0.4s cubic-bezier(0.27, 1.27, 0.48, 0.56)',
    '&:active': {
      backgroundColor: '#cce7ff'
    },
  },
  emojiSuggestionsEntryFocused: {
    composes: '$emojiSuggestionsEntry',
    backgroundColor: '#e6f3ff'
  },
  emojiSuggestionsEntryText: {
    display: 'inline-block',
    marginLeft: '8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '368px',
    fontSize: '0.9em'
  },
  emojiSuggestionsEntryIcon: {
    width: '1em',
    height: '1em',
    marginLeft: '0.25em',
    marginRight: '0.25em',
    display: 'inline-block',
    verticalAlign: 'top'
  },
  emojiSuggestions: {
    border: '1px solid #eee',
    marginTop: '1.75em',
    position: 'absolute',
    minWidth: '220px',
    maxWidth: '440px',
    background: '#fff',
    borderRadius: '2px',
    boxShadow: '0px 4px 30px 0px rgba(220, 220, 220, 1)',
    cursor: 'pointer',
    paddingTop: '8px',
    paddingBottom: '8px',
    zIndex: '2',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    transform: 'scale(0)'
  },
  emojiSelect: {
    display: 'inline-block'
  },
  emojiSelectButton: {
    extend: emojiButtonStyles,
  },
  emojiSelectButtonPressed: {
    extend: emojiButtonStyles,
    background: '#ededed',
  },
  emojiSelectPopover: {
    marginTop: '10px',
    padding: '0 0.3em',
    position: 'absolute',
    zIndex: '1000',
    boxSizing: 'content-box',
    background: '#fff',
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 30px 0 gainsboro'
  },
  emojiSelectPopoverClosed: {
    display: 'none'
  },
  emojiSelectPopoverTitle: {
    margin: '0 0 0.3em',
    paddingLeft: '1em',
    height: '2.5em',
    lineHeight: '2.5em',
    fontWeight: 'normal',
    fontSize: '1em',
    color: '#9e9e9e'
  },
  emojiSelectPopoverGroups: {
    margin: '0 0 0.3em',
    position: 'relative',
    zIndex: '0',
    width: '21em',
    height: '20em',
    '&:hover $emojiSelectPopoverScrollbar': {
      opacity: '0.3'
    },
    '& $emojiSelectPopoverScrollbar:hover, & $emojiSelectPopoverScrollbar:active': {
      opacity: '0.6'
    }
  },
  emojiSelectPopoverGroup: {
    padding: '0 0.5em',
    '&:first-child $emojiSelectPopoverGroupTitle': {
      display: 'none'
    },
  },
  emojiSelectPopoverGroupTitle: {
    margin: '1em 0',
    paddingLeft: '0.5em',
    fontWeight: 'normal',
    fontSize: '1em',
    color: '#9e9e9e'
  },
  emojiSelectPopoverGroupList: {
    margin: '0',
    padding: '0',
    display: 'flex',
    listStyle: 'none',
    flexWrap: 'wrap'
  },
  emojiSelectPopoverGroupItem: {
    width: '2.5em',
    height: '2.5em'
  },
  emojiSelectPopoverToneSelect: {
    position: 'absolute',
    left: '0',
    right: '0',
    top: '0',
    bottom: '0',
    zIndex: '2'
  },
  emojiSelectPopoverToneSelectList: {
    margin: '0.3em',
    padding: '0.3em',
    position: 'absolute',
    display: 'flex',
    listStyle: 'none',
    border: '1px solid #e0e0e0',
    borderRadius: '0.5em',
    background: '#fff',
    boxShadow: '0 0 0.3em rgba(0, 0, 0, 0.1)'
  },
  emojiSelectPopoverToneSelectItem: {
    width: '2.5em',
    height: '2.5em',
    '&:first-child': {
      borderRight: '1px solid #e0e0e0'
    },
  },
  emojiSelectPopoverEntry: {
    extend: entryStyles,
  },
  emojiSelectPopoverEntryFocused: {
    extend: entryStyles,
    backgroundColor: '#efefef'
  },
  emojiSelectPopoverEntryIcon: {
    width: '1.5em',
    height: '1.5em',
    verticalAlign: 'middle'
  },
  emojiSelectPopoverNav: {
    margin: '0',
    padding: '0 0.5em',
    display: 'flex',
    width: '20em',
    listStyle: 'none'
  },
  emojiSelectPopoverNavItem: {
    width: '2.5em',
    height: '2.5em'
  },
  emojiSelectPopoverNavEntry: {
    extend: navEntryStyles,
  },
  emojiSelectPopoverNavEntryActive: {
    extend: navEntryStyles,
    color: '#42a5f5'
  },
  emojiSelectPopoverScrollbar: {
    position: 'absolute',
    right: '0',
    top: '0.3em',
    bottom: '0.3em',
    width: '0.25em',
    backgroundColor: '#e0e0e0',
    borderRadius: '0.125em',
    opacity: '0.1',
    transition: 'opacity 0.4s'
  },
  emojiSelectPopoverScrollbarThumb: {
    backgroundColor: '#000',
    borderRadius: '0.125em',
    cursor: 'pointer'
  },
};

export const emojiPlugin = createEmojiPlugin({
  theme: styles,
});
const { EmojiSuggestions } = emojiPlugin;

export default EmojiSuggestions;
