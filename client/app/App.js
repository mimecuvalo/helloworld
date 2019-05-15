import './App.css';
import Admin from '../admin/Admin';
import classNames from 'classnames';
import clientHealthCheck from './client_health_check';
import CloseIcon from '@material-ui/icons/Close';
import Content from '../content/Content';
import CssBaseline from '@material-ui/core/CssBaseline';
import Dashboard from '../dashboard/Dashboard';
import { defineMessages, injectIntl } from '../../shared/i18n';
import ErrorBoundary from '../error/ErrorBoundary';
import Footer from './Footer';
import Header from './Header';
import IconButton from '@material-ui/core/IconButton';
import { Route, Switch, withRouter } from 'react-router-dom';
import React, { Component, PureComponent } from 'react';
import Search from '../content/Search';
import { SnackbarProvider, withSnackbar } from 'notistack';
import styles from './constants.module.css';
import UserContext from './User_Context';

const messages = defineMessages({
  close: { msg: 'Close' },
});

// This is the main entry point on the client-side.
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userContext: {
        user: props.user,
      },
      devOnlyHiddenOnLoad: process.env.NODE_ENV === 'development',
    };
  }

  componentDidMount() {
    // Remove MaterialUI's SSR generated CSS.
    const jssStyles = document.getElementById('jss-ssr');
    if (jssStyles && jssStyles.parentNode) {
      jssStyles.parentNode.removeChild(jssStyles);
    }

    // Upon starting the app, kick off a client health check which runs periodically.
    clientHealthCheck();

    this.setState({ devOnlyHiddenOnLoad: false });
  }

  renderDashboard() {
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

  render() {
    // HACK(all-the-things): we can't get rid of FOUC in dev mode because we want hot reloading of CSS updates.
    // This hides the unsightly unstyled app. However, in dev mode, it removes the perceived gain of SSR. :-/
    const devOnlyHiddenOnLoadStyle = this.state.devOnlyHiddenOnLoad ? { opacity: 0 } : null;

    return (
      <UserContext.Provider value={this.state.userContext}>
        <SnackbarProvider action={closeAction}>
          <ErrorBoundary>
            <div
              className={classNames('App', styles.app, { 'App-logged-in': this.props.user })}
              style={devOnlyHiddenOnLoadStyle}
            >
              <CssBaseline />
              <Header />
              <main className="App-main">
                <ScrollToTop>
                  <Switch>
                    <Route path={`/dashboard`} component={this.renderDashboard} />
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
              <Footer />
            </div>
          </ErrorBoundary>
        </SnackbarProvider>
      </UserContext.Provider>
    );
  }
}

@injectIntl
@withSnackbar
class CloseButton extends PureComponent {
  render() {
    const closeAriaLabel = this.props.intl.formatMessage(messages.close);
    return (
      <IconButton
        key="close"
        onClick={() => {
          this.props.closeSnackbar(this.props.snackKey);
        }}
        className="App-snackbar-icon"
        color="inherit"
        aria-label={closeAriaLabel}
      >
        <CloseIcon />
      </IconButton>
    );
  }
}
const closeAction = key => <CloseButton snackKey={key} />;

@withRouter
class ScrollToTop extends Component {
  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0);
    }
  }

  render() {
    return this.props.children;
  }
}

export default App;
