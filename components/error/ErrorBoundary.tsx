import * as Sentry from '@sentry/react';

import { F } from 'i18n';
import { styled } from '@mui/material/styles';

const H1 = styled('h1')`
  border: 3px double #f00;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px;
  font-weight: 400;
  color: #f00;
`;

// See React's documentation: https://reactjs.org/docs/error-boundaries.html
export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <H1>
          <F defaultMessage="Something went wrong. 😦" />
        </H1>
      }
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
