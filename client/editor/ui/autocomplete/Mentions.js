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

    this.mentions = [
      {
        name: 'Mime Čuvalo',
        link: 'https://nite-lite.net',
        avatar: 'https://nite-lite.net/resource/mime/nightlight/Light-Bulb.jpg',
      },
    ];

    this.state = {
      suggestions: this.mentions,
    };
  }

  onSearchChange = ({ value }) => {
    this.setState({
      suggestions: defaultSuggestionsFilter(value, this.mentions),
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
