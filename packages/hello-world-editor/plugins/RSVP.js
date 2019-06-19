import { decoratedBlocksToHTML } from '../utils/Blocks';
import linkifyit from 'linkify-it';
import React, { PureComponent } from 'react';

const rsvpRegex = /yes|no|maybe|interested/i;
const linkify = linkifyit();
linkify.add('rsvp ', {
  validate: function (text, pos, self) {
    var tail = text.slice(pos);
    const match = tail.match(rsvpRegex);
    return match ? match[0].length : 0;
  },
});

export default (config = {}) => {
  return {
    blockToHTML: decoratedBlocksToHTML(strategy, Component),
    decorators: [
      {
        strategy,
        component: Component,
      },
    ],
  };
};

function strategy(contentBlock, callback) {
  const links = (linkify.match(contentBlock.text !== undefined ? contentBlock.text : contentBlock.get('text')) || [])
      .filter(link => link.schema === 'rsvp ');
  if (links.length) {
    for (let i = 0; i < links.length; i += 1) {
      callback(links[i].index, links[i].lastIndex);
    }
  }
};

class Component extends PureComponent {
  render() {
    const { decoratedText } = this.props;

    return <span className="p-rsvp">{decoratedText}</span>;
  }
}