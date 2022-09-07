import { Emoji, Message } from 'components/error/error.styles';
import { F, defineMessages, useIntl } from 'i18n';

import Link from 'next/link';

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
      <h1>
        <span className="notranslate">404:</span> <F defaultMessage="not found" />
      </h1>
      <div>
        <F defaultMessage="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <F
          defaultMessage="try going back to the <a>beginning</a>."
          values={{
            a: (msg: string) => (
              <Link href="/" passHref>
                <a>{msg}</a>
              </Link>
            ),
          }}
        />
      </div>
    </Message>
  );
}
