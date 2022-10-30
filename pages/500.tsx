import { Emoji, Message } from 'components/error/error.styles';
import { F, defineMessages, useIntl } from 'i18n';

import { Typography } from 'components';

const messages = defineMessages({
  monkeys: { defaultMessage: 'see no evil, hear no evil, speak no evil monkeys' },
});

export default function InternalServerError() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.monkeys);

  return (
    <Message>
      <Emoji role="img" aria-label={emojiAriaLabel}>
        🙈 🙉 🙊
      </Emoji>
      <Typography variant="h1">
        <span className="notranslate">500:</span> <F defaultMessage="internal server error" />
      </Typography>
      <div>
        <F defaultMessage="it's not you, it's us. our server is monkeying around." />
        <br />
        <F defaultMessage="we've logged this error and we'll fix it soon." />
      </div>
    </Message>
  );
}
