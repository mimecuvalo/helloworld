import { Emoji, Message } from './error.styles';
import { F, defineMessages, useIntl } from 'i18n';

const messages = defineMessages({
  personGesturingNo: { defaultMessage: 'person gesturing no' },
});

export default function Forbidden() {
  const intl = useIntl();
  const emojiAriaLabel = intl.formatMessage(messages.personGesturingNo);

  return (
    <Message>
      <Emoji role="img" aria-label={emojiAriaLabel}>
        🙅
      </Emoji>
      <h1>
        <span className="notranslate">403:</span> <F defaultMessage="forbidden" />
      </h1>
      <div>
        <F defaultMessage="i'm sorry, dave. i'm afraid i can't do that." />
        <br />
        <F defaultMessage="try logging in." />
      </div>
    </Message>
  );
}
