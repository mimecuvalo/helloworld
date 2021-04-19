import { F, defineMessages, useIntl } from 'shared/util/i18n';

import useStyles from './errorStyles';

const messages = defineMessages({
  upsideDownFace: { defaultMessage: 'upside down face' },
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
        404: <F defaultMessage="not found" />
      </h1>
      <div>
        <F defaultMessage="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <F defaultMessage="try going back to the <a>beginning</a>." values={{ a: (msg) => <a href="/">{msg}</a> }} />
      </div>
    </div>
  );
}
