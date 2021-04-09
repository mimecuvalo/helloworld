import { Suspense, lazy, useEffect, useState } from 'react';

import { F } from 'react-intl-wrapper';
import Help from './Help';
import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
import { useLocation } from 'react-router-dom';

const useStyles = createUseStyles({
  footer: {
    position: 'fixed',
    bottom: '0',
    right: '0',
    clear: 'both',
    '& button': {
      marginLeft: '10px',
    },
  },

  dashboardFooter: {
    position: 'static',
    textAlign: 'right',
  },
});

export default function Footer() {
  const [isLoading, setIsLoading] = useState(true);
  const routerLocation = useLocation();
  const styles = useStyles();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  function renderDebugMenu() {
    // Conditionally compile this code. Should not appear in production.
    if (process.env.NODE_ENV === 'development') {
      // TODO(mime): Suspense and lazy aren't supported by ReactDOMServer yet (breaks SSR).
      const IS_CLIENT = typeof window !== 'undefined';
      const Fallback = (
        <span>
          <F msg="Loading…" />
        </span>
      );

      // To match SSR.
      if (isLoading) {
        return Fallback;
      }

      let SuspenseWithTemporaryWorkaround;
      if (IS_CLIENT) {
        const Debug = lazy(() => import('client/internal/Debug'));
        SuspenseWithTemporaryWorkaround = (
          <Suspense fallback={Fallback}>
            <Debug />
          </Suspense>
        );
      } else {
        SuspenseWithTemporaryWorkaround = Fallback;
      }

      return SuspenseWithTemporaryWorkaround;
    }

    return null;
  }

  function renderHelp() {
    // Conditionally compile this code. Should not appear in production.
    if (process.env.NODE_ENV === 'development') {
      return <Help />;
    }

    return null;
  }

  return (
    <footer
      className={classNames(styles.footer, {
        [styles.dashboardFooter]: routerLocation.pathname === '/dashboard',
      })}
    >
      {renderDebugMenu()}
      {renderHelp()}
    </footer>
  );
}
