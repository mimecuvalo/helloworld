import { F, defineMessages, useIntl } from 'i18n';
import styles from './error.module.css';

const messages = defineMessages({
  monkeys: { defaultMessage: 'see no evil, hear no evil, speak no evil monkeys' },
});

export default function ServerError() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.monkeys);

  return (
    <div className={styles.message}>
      <span className={styles.emoji} role="img" aria-label={emojiAriaLabel}>
        🙈 🙉 🙊
      </span>
      <h1 className={styles.title}>
        <span className="notranslate">500:</span> <F defaultMessage="internal server error" />
      </h1>
      <div>
        <F defaultMessage="it's not you, it's us. our server is monkeying around." />
        <br />
        <F defaultMessage="we've logged this error and we'll fix it soon." />
      </div>
    </div>
  );
}
