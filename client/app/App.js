import './App.css';
import '../content/EditorPlugin.css'; // XXX(mime): this is a complete hack for now.
import Admin from '../admin/Admin';
import classNames from 'classnames';
import clientHealthCheck from './client_health_check';
import CloseIcon from '@material-ui/icons/Close';
import Content from '../content/Content';
import Dashboard from '../dashboard/Dashboard';
import { defineMessages, useIntl } from '../../shared/i18n';
import ErrorBoundary from '../error/ErrorBoundary';
import Footer from './Footer';
import Header from './Header';
import IconButton from '@material-ui/core/IconButton';
import { Route, Switch, useLocation } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import Search from '../content/Search';
import { SnackbarProvider, useSnackbar } from 'notistack';
import styles from './constants.module.css';
import UserContext from './User_Context';

const messages = defineMessages({
  close: { msg: 'Close' },
});

// This is the main entry point on the client-side.
export default function App({ user }) {
  const [userContext] = useState({ user });
  const [devOnlyHiddenOnLoad, setDevOnlyHiddenOnLoad] = useState(process.env.NODE_ENV === 'development');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) {
      return;
    }

    // Remove MaterialUI's SSR generated CSS.
    const jssStyles = document.getElementById('jss-ssr');
    if (jssStyles && jssStyles.parentNode) {
      jssStyles.parentNode.removeChild(jssStyles);
    }

    // Upon starting the app, kick off a client health check which runs periodically.
    clientHealthCheck();

    setDevOnlyHiddenOnLoad(false);
    setLoaded(true);
  }, [devOnlyHiddenOnLoad, loaded]);

  function renderDashboard() {
    return <Dashboard />;
    // TODO(mime): Can't get Suspense/lazy to play nicely with CSS modules yet.
    // TODO(mime): Suspense and lazy aren't supported by ReactDOMServer yet (breaks SSR).
    // const IS_CLIENT = typeof window !== 'undefined';
    // const Fallback = (
    //   <span>
    //     <F msg="Loading…" />
    //   </span>
    // );
    //
    // let SuspenseWithTemporaryWorkaround;
    // if (IS_CLIENT) {
    //   const Dashboard = lazy(() => import('../dashboard/Dashboard'));
    //   SuspenseWithTemporaryWorkaround = (
    //     <Suspense fallback={Fallback}>
    //       <Dashboard />
    //     </Suspense>
    //   );
    // } else {
    //   SuspenseWithTemporaryWorkaround = Fallback;
    // }
    //
    // return SuspenseWithTemporaryWorkaround;
  }

  // HACK(all-the-things): we can't get rid of FOUC in dev mode because we want hot reloading of CSS updates.
  // This hides the unsightly unstyled app. However, in dev mode, it removes the perceived gain of SSR. :-/
  const devOnlyHiddenOnLoadStyle = devOnlyHiddenOnLoad ? { opacity: 0 } : null;

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  const main = (
    <main className="App-main">
      <ScrollToTop>
        <Switch>
          <Route path={`/dashboard`} component={renderDashboard} />
          <Route path={`/admin`} component={Admin} />
          <Route path={`/:username/search/:query`} component={Search} />
          <Route
            path={[
              `/:username/:section/:album/:name`,
              `/:username/:section/:name`,
              `/:username/:name`,
              `/:username`,
              `/`,
            ]}
            component={Content}
          />
        </Switch>
      </ScrollToTop>
    </main>
  );

  return (
    <UserContext.Provider value={userContext}>
      <SnackbarProvider action={<CloseButton />}>
        <ErrorBoundary>
          <div className={classNames('App', styles.app, { 'App-logged-in': user })} style={devOnlyHiddenOnLoadStyle}>
            <Header />
            {isOffline ? <div>Running offline with service worker.</div> : main}
            <Footer />
          </div>
        </ErrorBoundary>
      </SnackbarProvider>
    </UserContext.Provider>
  );
}

function CloseButton(snackKey) {
  const intl = useIntl();
  const snackbar = useSnackbar();
  const closeAriaLabel = intl.formatMessage(messages.close);

  return (
    <IconButton
      key="close"
      onClick={() => snackbar.closeSnackbar(snackKey)}
      className="App-snackbar-icon"
      color="inherit"
      aria-label={closeAriaLabel}
    >
      <CloseIcon />
    </IconButton>
  );
}

function ScrollToTop({ children }) {
  const routerLocation = useLocation();
  const prevLocationPathname = useRef();

  useEffect(() => {
    if (routerLocation.pathname !== prevLocationPathname) {
      window.scrollTo(0, 0);
    }
    prevLocationPathname.current = routerLocation.pathname;
  });

  return children;
}
