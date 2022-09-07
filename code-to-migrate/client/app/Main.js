import { Route, Switch } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';

import Content from 'client/content/Content';
import { F } from 'shared/util/i18n';
import Footer from './Footer';
import Header from './Header';
import ScrollToTop from './ScrollToTop';
import Search from 'client/content/Search';

export default function MainApp() {
  const [isLoading, setIsLoading] = useState(true);
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  useEffect(() => {
    setIsLoading(false);
  }, []);

  function renderDashboard() {
    // TODO(mime): Suspense and lazy aren't supported by ReactDOMServer yet (breaks SSR).
    const IS_CLIENT = typeof window !== 'undefined';
    const Fallback = (
      <span>
        <F defaultMessage="Loading…" />
      </span>
    );

    // To match SSR.
    if (isLoading) {
      return Fallback;
    }

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