import './App.css';
import clientHealthCheck from './client_health_check';
import Content from '../content/Content';
import CssBaseline from '@material-ui/core/CssBaseline';
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

  render() {
    // HACK(all-the-things): we can't get rid of FOUC in dev mode because we want hot reloading of CSS updates.
    // This hides the unsightly unstyled app. However, in dev mode, it removes the perceived gain of SSR. :-/
    const devOnlyHiddenOnLoadStyle = this.state.devOnlyHiddenOnLoad ? { opacity: 0 } : null;

    return (
      <UserContext.Provider value={this.state.userContext}>
        <ErrorBoundary>
          <div className="App" style={devOnlyHiddenOnLoadStyle}>
            <CssBaseline />
            <Header />
            <main className="App-main">
              <Switch>
                <Route path={`/:username/:name`} component={Content} />
              </Switch>
            </main>
            <Footer />
          </div>
        </ErrorBoundary>
      </UserContext.Provider>
    );
  }
}
