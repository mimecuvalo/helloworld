import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin';
import React, { Component } from 'react';
import styles from './Mentions.module.css';

export const mentionPlugin = createMentionPlugin({
  theme: styles,
});
const { MentionSuggestions } = mentionPlugin;

export default class Mentions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      suggestions: this.normalizedData() || [],
    };
  }

  normalizedData() {
    if (!this.props.mentions) {
      return [];
    }

    return this.props.mentions.map(mention => {
      return {
        name: mention.name || mention.username,
        link: mention.profile_url,
        avatar: mention.avatar || mention.favicon,
      };
    });
  }

  onSearchChange = ({ value }) => {
    this.setState({
      suggestions: defaultSuggestionsFilter(value, this.normalizedData() || []),
    });
  };

  onAddMention = () => {
    // get the mention object selected
  };

  render() {
    return (
      <MentionSuggestions
        onSearchChange={this.onSearchChange}
        suggestions={this.state.suggestions}
        onAddMention={this.onAddMention}
      />
    );
  }
}
