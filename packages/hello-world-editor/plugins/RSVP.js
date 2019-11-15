import { decoratedBlocksToHTML } from '../utils/Blocks';
import linkifyit from 'linkify-it';
import React from 'react';

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

function Component({ decoratedText }) {
  return (
    <span className="hw-editor-rsvp-wrapper">
      <span>RSVP </span>
      <span className="p-rsvp">{decoratedText.slice(5)}</span>
    </span>
  );
}
