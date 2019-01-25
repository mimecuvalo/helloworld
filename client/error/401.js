import { defineMessages, F, injectIntl } from '../../shared/i18n';
import React from 'react';
import styles from './Error.module.css';

const messages = defineMessages({
  personGesturingNo: { msg: 'person gesturing no' },
});

const Unauthorized = React.memo(function Unauthorized({ intl }) {
  const emojiAriaLabel = intl.formatMessage(messages.personGesturingNo);

  return (
    <div className={styles.message}>
      <span className={styles.emoji} role="img" aria-label={emojiAriaLabel}>
        🙅
      </span>
      <h1>
        401: <F msg="unauthorized" />
      </h1>
      <div>
        <F msg="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <F msg="try logging in." />
      </div>
    </div>
  );
});

export default injectIntl(Unauthorized);
