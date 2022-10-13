import { F } from 'i18n';
//import { MouseEvent } from 'react';

// const messages = defineMessages({
//   reply: { defaultMessage: 'replying to' },
// });

export default function Reply(props: { contentRemote: ContentRemote }) {
  // TODO fix up
  // const intl = useIntl();

  // const handleClick = (evt: MouseEvent) => {
  //   const { type, link } = contentRemote;
  //   if (type === 'remote-comment') {
  //     window.open(link, link, 'noopener,noreferrer');
  //     return;
  //   }

  //   // TODO(mime): in future would be great to send html.
  //   // const replyingToMsg = intl.formatMessage(messages.reply);
  //   // props.getEditor().insertText(`${replyingToMsg} > ${link}`);
  // };

  return (
    <button className="hw-button-link">
      <F defaultMessage="reply" />
    </button>
  );
}
