import './App.css';
import classNames from 'classnames';
import clientHealthCheck from './client_health_check';
import Content from '../content/Content';
import CssBaseline from '@material-ui/core/CssBaseline';
import Dashboard from '../dashboard/Dashboard';
import ErrorBoundary from '../error/ErrorBoundary';
import Footer from './Footer';
import Header from './Header';
import { Route, Switch } from 'react-router-dom';
import React, { Component } from 'react';
import UserContext from './User_Context';

// This is the main entry point on the client-side.
export default class App extends Component {
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
        <ErrorBoundary>
          <div className={classNames('App', { 'App-logged-in': this.props.user })} style={devOnlyHiddenOnLoadStyle}>
            <CssBaseline />
            <Header />
            <main className="App-main">
              <Switch>
                <Route path={`/dashboard`} component={this.renderDashboard} />
                <Route path={`/:username/:section/:album/:name`} component={Content} />
                <Route path={`/:username/:section/:name`} component={Content} />
                <Route path={`/:username/:name`} component={Content} />
                <Route path={`/:username`} component={Content} />
                <Route path={`/`} component={Content} />
              </Switch>
            </main>
            <Footer />
          </div>
        </ErrorBoundary>
      </UserContext.Provider>
    );
  }
}
