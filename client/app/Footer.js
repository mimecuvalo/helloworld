import { Suspense, lazy, memo, useEffect, useState } from 'react';

import { F } from 'react-intl-wrapper';
import Help from './Help';
import { createUseStyles } from 'react-jss';

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
});

// NB: we memoize here because it has the a11y script included on dev which is expensive.
const Footer = memo(function Footer() {
  const [isLoading, setIsLoading] = useState(true);
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
    <footer className={styles.footer}>
      {renderDebugMenu()}
      {renderHelp()}
    </footer>
  );
});
export default Footer;
