import { defineMessages, F, useIntl } from 'react-intl-wrapper';
import useStyles from './errorStyles';

const messages = defineMessages({
  personGesturingNo: { msg: 'person gesturing no' },
});

export default function Forbidden() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.personGesturingNo);
  const styles = useStyles();

  return (
    <div className={styles.message}>
      <span className={styles.emoji} role="img" aria-label={emojiAriaLabel}>
        🙅
      </span>
      <h1>
        403: <F msg="forbidden" />
      </h1>
      <div>
        <F msg="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <F msg="try logging in." />
      </div>
    </div>
  );
}
