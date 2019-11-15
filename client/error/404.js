import { defineMessages, F, useIntl } from '../../shared/i18n';
import React from 'react';
import useStyles from './errorStyles';

const messages = defineMessages({
  upsideDownFace: { msg: 'upside down face' },
});

export default function NotFound() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.upsideDownFace);
  const styles = useStyles();

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
        <F msg="try going back to the <a>beginning</a>." values={{ a: msg => <a href="/">{msg}</a> }} />
      </div>
    </div>
  );
}
