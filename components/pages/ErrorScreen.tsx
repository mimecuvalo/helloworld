import { useEffect } from 'react';
import type { ErrorComponentProps } from '@tanstack/react-router';
import * as Sentry from '@sentry/tanstackstart-react';
import { F, IntlProvider } from 'i18n';
import { logError } from 'lib/error';
import styles from './error.module.css';

function Content({ error }: { error: Error }) {
  useEffect(() => {
    logError({ message: error?.message, stack: error?.stack });
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className={styles.message}>
      <span className={styles.emoji} role="img" aria-label="worried face">
        😦
      </span>
      <h1 className={styles.title}>
        <F defaultMessage="Something went wrong. 😦" />
      </h1>
    </div>
  );
}

export default function ErrorScreen({ error }: ErrorComponentProps) {
  return (
    <IntlProvider defaultLocale="en" locale="en" messages={{}}>
      <Content error={error} />
    </IntlProvider>
  );
}
