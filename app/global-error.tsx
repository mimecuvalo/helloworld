'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { F } from 'i18n';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Report error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h2>
            <F defaultMessage="Something went wrong!" />
          </h2>
          <p>
            <F defaultMessage="An error has occurred while rendering this page." />
          </p>
          <button
            onClick={reset}
            style={{
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
        </div>
      </body>
    </html>
  );
}
