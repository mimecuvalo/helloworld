import { Route, Switch, useLocation } from 'react-router-dom';
import { animated, useTransition } from 'react-spring';

import Content from 'client/content/Content';
import Dashboard from 'client/dashboard/Dashboard';
import Footer from './Footer';
import Header from './Header';
import ScrollToTop from './ScrollToTop';
import Search from 'client/content/Search';

export default function MainApp() {
  const location = useLocation();
  console.log(location);
  const transition = useTransition(location, {
    from: { position: 'absolute', opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

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
    //   const Dashboard = lazy(() => import('client/dashboard/Dashboard'));
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
      {transition((style, item) => {
        return (
          <animated.div style={style}>
            <ScrollToTop>
              <Switch location={item}>
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
          </animated.div>
        );
      })}
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
