import Content from '../content/Content';
import Dashboard from '../dashboard/Dashboard';
import Footer from './Footer';
import Header from './Header';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';
import Search from '../content/Search';

export default function MainApp() {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  function renderDashboard() {
    return <Dashboard />;
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
