import { defineMessages, useIntl } from 'react-intl-wrapper';
import { useEffect, useState } from 'react';

const messages = defineMessages({
  avatar: { msg: 'user avatar' },
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
