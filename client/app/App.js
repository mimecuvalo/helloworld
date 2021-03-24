// XXX(mime): wtf this causes server/client mismatch if i don't include it ARGH
import Forbidden from '../error/403'; // eslint-disable-line no-unused-vars

import AdminApp from '../admin';
import './analytics';
import './App.css';
import '../content/EditorPlugin.css'; // XXX(mime): this is a complete hack for now.
import classNames from 'classnames';
import clientHealthCheck from './client_health_check';
import CloseIcon from '@material-ui/icons/Close';
import { defineMessages, useIntl } from 'react-intl-wrapper';
import ErrorBoundary from '../error/ErrorBoundary';
import IconButton from '@material-ui/core/IconButton';
import MainApp from './Main';
import { Route, Switch } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
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

  // XXX(all-the-things): we can't get rid of FOUC in dev mode because we want hot reloading of CSS updates.
  // This hides the unsightly unstyled app. However, in dev mode, it removes the perceived gain of SSR. :-/
  const devOnlyHiddenOnLoadStyle = devOnlyHiddenOnLoad ? { opacity: 0 } : null;

  return (
    <UserContext.Provider value={userContext}>
      <SnackbarProvider action={<CloseButton />}>
        <ErrorBoundary>
          <div
            className={classNames('App', {
              'App-logged-in': user,
              'App-is-development': process.env.NODE_ENV === 'development',
            })}
            style={devOnlyHiddenOnLoadStyle}
          >
            <Switch>
              <Route path="/admin" component={AdminApp} />
              <Route component={MainApp} />
            </Switch>
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
