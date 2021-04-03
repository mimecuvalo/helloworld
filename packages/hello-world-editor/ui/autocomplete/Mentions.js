import createMentionPlugin, { defaultSuggestionsFilter } from '@draft-js-plugins/mention';
import React, { useState } from 'react';

const mentionStyles = {
  color: '#575f67',
  cursor: 'pointer',
  display: 'inline-block',
  background: '#e6f3ff',
  paddingLeft: '2px',
  paddingRight: '2px',
  borderRadius: '2px',
  textDecoration: 'none',
};

const entryStyles = {
  padding: '7px 10px 3px 10px',
  transition: 'background-color 0.4s cubic-bezier(0.27, 1.27, 0.48, 0.56)',
  '&:active': {
    backgroundColor: '#cce7ff'
  },
};

const styles = {
  mention: {
    extend: mentionStyles,
    '&:visited': {
      extend: mentionStyles,
    },
    '&:hover, &:focus': {
      color: '#677584',
      background: '#edf5fd',
      outline: '0'
    },
    '&:active': {
      color: '#222',
      background: '#455261'
    },
  },
  mentionSuggestionsEntry: {
    extend: entryStyles,
  },
  mentionSuggestionsEntryFocused: {
    extend: entryStyles,
    backgroundColor: '#e6f3ff'
  },
  mentionSuggestionsEntryText: {
    display: 'inline-block',
    marginLeft: '8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '368px',
    fontSize: '0.9em',
    marginBottom: '0.2em',
    lineHeight: '22px'
  },
  mentionSuggestionsEntryAvatar: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    borderRadius: '12px',
    verticalAlign: 'top'
  },
  mentionSuggestions: {
    border: '1px solid #eee',
    marginTop: '0.4em',
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
  }
};

export const mentionPlugin = createMentionPlugin({
  // TODO(mime): theme migration
  //theme: styles,
});
const { MentionSuggestions } = mentionPlugin;

export default function Mentions({ mentions }) {
  const [suggestions, setSuggestions] = useState(normalizedData() || []);

  function normalizedData() {
    if (!mentions) {
      return [];
    }

    return mentions.map(mention => {
      return {
        name: mention.name || mention.username,
        link: mention.profile_url,
        avatar: mention.avatar || mention.favicon,
      };
    });
  }

  const onSearchChange = ({ value }) => {
    setSuggestions(defaultSuggestionsFilter(value, normalizedData() || []));
  };

  const onAddMention = () => {
    // get the mention object selected
  };

  return (
    <MentionSuggestions
      onSearchChange={onSearchChange}
      suggestions={suggestions}
      onAddMention={onAddMention}
    />
  );
}
