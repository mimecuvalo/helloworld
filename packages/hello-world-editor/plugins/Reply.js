import { decoratedBlocksToHTML } from '../utils/Blocks';
import linkifyit from 'linkify-it';

const linkify = linkifyit();
linkify.add('> ', {
  validate: function (text, pos, self) {
    const tail = text.slice(pos);
    const schemaLength = tail.indexOf('/');
    const linkLength = linkify.testSchemaAt(tail.slice(schemaLength), 'http:', 0);
    return linkLength ? linkLength + schemaLength : 0;
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
  const links = (
    linkify.match(contentBlock.text !== undefined ? contentBlock.text : contentBlock.get('text')) || []
  ).filter((link) => link.schema === '> ');
  if (links.length) {
    for (let i = 0; i < links.length; i += 1) {
      callback(links[i].index, links[i].lastIndex);
    }
  }
}

function Component({ decoratedText }) {
  const links = linkify.match(decoratedText || '');
  const href = links?.length && links[0].url.slice(2);

  return (
    <span className="hw-in-reply-to">
      &gt;&nbsp;
      <a href={href} target="_blank" rel="noreferrer noopener" className="u-in-reply-to">
        {decoratedText.slice(2)}
      </a>
    </span>
  );
}
