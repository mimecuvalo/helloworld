'use client';

import { Emoji, Message } from 'components/error/error.styles';
import { F, defineMessages, useIntl } from 'i18n';
import { Typography } from 'components';
import { useEffect } from 'react';
import { logError } from 'components/error/error';

const messages = defineMessages({
  monkeys: { defaultMessage: 'see no evil, hear no evil, speak no evil monkeys' },
});

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.monkeys);

  useEffect(() => {
    // Log error to server
    logError(error);
  }, [error]);

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
      {reset && (
        <button
          onClick={reset}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          <F defaultMessage="Try again" />
        </button>
      )}
    </Message>
  );
}
