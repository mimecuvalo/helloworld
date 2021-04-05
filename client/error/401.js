import { createLock } from '../app/auth';
import { defineMessages, F, useIntl } from 'react-intl-wrapper';
import useStyles from './errorStyles';

const messages = defineMessages({
  personGesturingNo: { msg: 'person gesturing no' },
});

export default function Unauthorized() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.personGesturingNo);
  const styles = useStyles();

  function handleLogin(evt) {
    evt.preventDefault();
    createLock().show();
  }

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
        <F
          msg="try <a>logging in</a>."
          values={{
            a: (msg) => (
              <a href="#login" onClick={handleLogin}>
                {msg}
              </a>
            ),
          }}
        />
      </div>
    </div>
  );
}
