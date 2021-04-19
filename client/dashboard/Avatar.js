import { defineMessages, useIntl } from 'shared/util/i18n';
import { useEffect, useState } from 'react';

const messages = defineMessages({
  avatar: { defaultMessage: 'user avatar' },
});

export default function Avatar({ src }) {
  const intl = useIntl();
  const [validSrc, setValidSrc] = useState('/img/pixel.gif');

  useEffect(() => {
    const img = new Image();
    img.onload = () => img.naturalWidth && setValidSrc(src);
    img.src = src;
  }, [src]);

  return <img src={validSrc} alt={intl.formatMessage(messages.avatar)} />;
}
