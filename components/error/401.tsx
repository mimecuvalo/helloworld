import { Emoji, Message } from './error.styles';
import { F, defineMessages, useIntl } from 'i18n';
import { Link, Typography } from 'components';

const messages = defineMessages({
  personGesturingNo: { defaultMessage: 'person gesturing no' },
});

export default function Unauthorized() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.personGesturingNo);

  return (
    <Message>
      <Emoji role="img" aria-label={emojiAriaLabel}>
        🙅
      </Emoji>
      <Typography variant="h1">
        <span className="notranslate">401:</span> <F defaultMessage="unauthorized" />
      </Typography>
      <div>
        <F defaultMessage="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <F
          defaultMessage="try <a>logging in</a>."
          values={{
            a: (msg: string) => <Link href="/api/auth/login">{msg}</Link>,
          }}
        />
      </div>
    </Message>
  );
}
