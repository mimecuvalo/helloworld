import { useIntl } from 'react-intl';
import { useEffect } from 'react';
import { useSnackbar } from 'notistack';

export default function HiddenSnackbarShim({ message, variant }) {
  const intl = useIntl();
  const snackbar = useSnackbar();

  useEffect(() => {
    snackbar.enqueueSnackbar(intl.formatMessage(message), { variant });
  });

  return null;
}