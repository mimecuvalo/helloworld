import * as Sentry from '@sentry/react';

import { Typography, styled } from 'components';

import { F } from 'i18n';

const H1 = styled(Typography)`
  border: 3px double ${(props) => props.theme.palette.error.dark};
  border-radius: ${(props) => props.theme.shape.borderRadius}px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${(props) => props.theme.spacing(1)};
  font-weight: 400;
  color: ${(props) => props.theme.palette.error.dark};
`;

// See React's documentation: https://reactjs.org/docs/error-boundaries.html
export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    // @ts-ignore this is fine.
    <Sentry.ErrorBoundary
      fallback={
        <H1 variant="h1">
          <F defaultMessage="Something went wrong. 😦" />
        </H1>
      }
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
