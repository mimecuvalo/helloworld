import { defineMessages, F, FHTML, injectIntl } from '../../shared/i18n';
import React from 'react';
import styles from './Error.module.css';

const messages = defineMessages({
  upsideDownFace: { msg: 'upside down face' },
});

const NotFound = React.memo(function NotFound({ intl }) {
  const emojiAriaLabel = intl.formatMessage(messages.upsideDownFace);

  return (
    <div className={styles.message}>
      <span className={styles.emojiSpin} role="img" aria-label={emojiAriaLabel}>
        🙃
      </span>
      <h1>
        404: <F msg="not found" />
      </h1>
      <div>
        <F msg="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <FHTML msg="try going back to the <a href='/'>beginning</a>." />
      </div>
    </div>
  );
});

export default injectIntl(NotFound);
