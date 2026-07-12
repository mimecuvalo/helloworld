import { F, defineMessages, useIntl } from 'i18n';
import styles from './error.module.css';

const messages = defineMessages({
  upsideDownFace: { defaultMessage: 'upside down face' },
});

export default function NotFound() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.upsideDownFace);

  return (
    <div className={styles.message}>
      <span className={styles.emoji} role="img" aria-label={emojiAriaLabel}>
        🙃
      </span>
      <h1 className={styles.title}>
        <span className="notranslate">404:</span> <F defaultMessage="not found" />
      </h1>
      <div>
        <F defaultMessage="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <F
          defaultMessage="try going back to the <a>beginning</a>."
          values={{
            a: (msg) => <a href="/">{msg}</a>,
          }}
        />
      </div>
    </div>
  );
}
