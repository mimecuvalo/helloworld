import { Route, Switch } from 'react-router-dom';
import { Suspense, lazy } from 'react';

import Content from 'client/content/Content';
import { F } from 'react-intl-wrapper';
import Footer from './Footer';
import Header from './Header';
import ScrollToTop from './ScrollToTop';
import Search from 'client/content/Search';

export default function MainApp() {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  function renderDashboard() {
    const IS_CLIENT = typeof window !== 'undefined';
    const Fallback = (
      <span>
        <F msg="Loading…" />
      </span>
    );

    let SuspenseWithTemporaryWorkaround;
    if (IS_CLIENT) {
      const Dashboard = lazy(() => import('client/dashboard/Dashboard'));
      SuspenseWithTemporaryWorkaround = (
        <Suspense fallback={Fallback}>
          <Dashboard />
        </Suspense>
      );
    } else {
      SuspenseWithTemporaryWorkaround = Fallback;
    }

    return SuspenseWithTemporaryWorkaround;
  }

  const main = (
    <main className="App-main">
      <ScrollToTop>
        <Switch>
          <Route path={`/dashboard`} component={renderDashboard} />
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
    <>
      <Header />
      {isOffline ? <div>Running offline with service worker.</div> : main}
      <Footer />
    </>
  );
}
