import { defineMessages, F, useIntl } from 'react-intl-wrapper';
import React from 'react';

const messages = defineMessages({
  reply: { msg: 'replying to' },
});

export default function Reply(props) {
  const intl = useIntl();

  const handleClick = evt => {
    const { type, link } = props.contentRemote;
    if (type === 'remote-comment') {
      window.open(link, link, 'noopener,noreferrer');
      return;
    }

    // TODO(mime): in future would be great to send html.
    const replyingToMsg = intl.formatMessage(messages.reply);
    props.getEditor().insertText(`${replyingToMsg} > ${link}`);
  };

  return (
    <button className="hw-button-link" onClick={handleClick}>
      <F msg="reply" />
    </button>
  );
}
