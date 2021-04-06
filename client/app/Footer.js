import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
//import { F } from 'react-intl-wrapper';
import Help from './Help';
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

let Debug = () => null;
if (process.env.NODE_ENV === 'development') {
  Debug = require('client/internal/Debug').default;
}

export default function Footer() {
  const routerLocation = useLocation();
  const styles = useStyles();

  function renderDebugMenu() {
    // Conditionally compile this code. Should not appear in production.
    if (process.env.NODE_ENV === 'development') {
      // TODO(mime): Suspense and lazy aren't supported by ReactDOMServer yet (breaks SSR).
      // TODO(mime): Ever since React 16.10.0 the mismatch of SSR is causing a clientside error :-/
      //    Re-enable this code later when SSR works for Suspense.
      return <Debug />;
      // const IS_CLIENT = typeof window !== 'undefined';
      // const Fallback = (
      //   <span>
      //     <F msg="Loading…" />
      //   </span>
      // );
      //
      // let SuspenseWithTemporaryWorkaround;
      // if (IS_CLIENT) {
      //   const Debug = lazy(() => import('client/internal/Debug'));
      //   SuspenseWithTemporaryWorkaround = (
      //     <Suspense fallback={Fallback}>
      //       <Debug />
      //     </Suspense>
      //   );
      // } else {
      //   SuspenseWithTemporaryWorkaround = Fallback;
      // }
      //
      // return SuspenseWithTemporaryWorkaround;
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
