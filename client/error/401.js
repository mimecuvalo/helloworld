import { F, defineMessages, useIntl } from 'shared/util/i18n';

import { createLock } from 'client/app/auth';
import useStyles from './errorStyles';

const messages = defineMessages({
  personGesturingNo: { defaultMessage: 'person gesturing no' },
});

export default function Unauthorized() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.personGesturingNo);
  const styles = useStyles();

  async function handleLogin(evt) {
    evt.preventDefault();
    (await createLock()).show();
  }

  return (
    <div className={styles.message}>
      <span className={styles.emoji} role="img" aria-label={emojiAriaLabel}>
        🙅
      </span>
      <h1>
        401: <F defaultMessage="unauthorized" />
      </h1>
      <div>
        <F defaultMessage="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <F
          defaultMessage="try <a>logging in</a>."
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
