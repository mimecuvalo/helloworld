import { ContentRemote } from 'data/graphql-generated';
import { F } from 'i18n';

export default function Reblog({ contentRemote }: { contentRemote: ContentRemote }) {
  // TODO fix up
  const type = contentRemote.type;

  // const handleClick = (evt) => {
  //   const type = contentRemote.type;
  //   if (type === 'remote-comment') {
  //     return;
  //   }

  //   // TODO(mime): in future would be great to send html.
  //   getEditor().reblog(contentRemote.link);
  // };

  return (
    <button disabled={type === 'remote-comment'} className="hw-button-link">
      <F defaultMessage="reblog" />
    </button>
  );
}
