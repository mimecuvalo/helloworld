import { defineMessages, F, injectIntl } from '../../../shared/i18n';
import React, { PureComponent } from 'react';

const messages = defineMessages({
  reply: { msg: 'replying to' },
});

@injectIntl
class Reply extends PureComponent {
  handleClick = evt => {
    const { type, link } = this.props.contentRemote;
    if (type === 'remote-comment') {
      window.open(link, link, 'noopener,noreferrer');
      return;
    }

    // TODO(mime): in future would be great to send html.
    const replyingToMsg = this.props.intl.formatMessage(messages.reply);
    this.props.getEditor().insertText(`${replyingToMsg} > ${link}`);
  };

  render() {
    return (
      <button className="hw-button-link" onClick={this.handleClick}>
        <F msg="reply" />
      </button>
    );
  }
}

export default Reply;
