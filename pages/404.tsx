import { Emoji, Message } from 'components/error/error.styles';
import { F, defineMessages, useIntl } from 'i18n';
import { Link, Typography } from 'components';

const messages = defineMessages({
  upsideDownFace: { defaultMessage: 'upside down face' },
});

export default function NotFound() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.upsideDownFace);

  return (
    <Message>
      <Emoji role="img" aria-label={emojiAriaLabel}>
        🙃
      </Emoji>
      <Typography variant="h1">
        <span className="notranslate">404:</span> <F defaultMessage="not found" />
      </Typography>
      <div>
        <F defaultMessage="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <F
          defaultMessage="try going back to the <a>beginning</a>."
          values={{
            a: (msg: string) => <Link href="/">{msg}</Link>,
          }}
        />
      </div>
    </Message>
  );
}
