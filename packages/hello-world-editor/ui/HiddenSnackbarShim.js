import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useSnackbar } from 'notistack';

export default function HiddenSnackbarShim({ message, variant }) {
  const intl = useIntl();
  const snackbar = useSnackbar();

  useEffect(() => {
    if (!message) {
      return null;
    }

    snackbar.enqueueSnackbar(intl.formatMessage(message), { variant });
  });

  return null;
}
