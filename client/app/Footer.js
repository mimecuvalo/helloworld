import classNames from 'classnames';
import { F } from '../../shared/i18n';
import Help from './Help';
import React, { PureComponent, lazy, Suspense } from 'react';
import styles from './Footer.module.css';
import { withRouter } from 'react-router-dom';

@withRouter
class Footer extends PureComponent {
  renderDebugMenu() {
    // Conditionally compile this code. Should not appear in production.
    if (process.env.NODE_ENV === 'development') {
      // TODO(mime): Suspense and lazy aren't supported by ReactDOMServer yet (breaks SSR).
      const IS_CLIENT = typeof window !== 'undefined';
      const Fallback = (
        <span>
          <F msg="Loading…" />
        </span>
      );

      let SuspenseWithTemporaryWorkaround;
      if (IS_CLIENT) {
        const Debug = lazy(() => import('../internal/Debug'));
        SuspenseWithTemporaryWorkaround = (
          <Suspense fallback={Fallback}>
            <Debug />
          </Suspense>
        );
      } else {
        SuspenseWithTemporaryWorkaround = Fallback;
      }

      return SuspenseWithTemporaryWorkaround;
    }

    return null;
  }

  renderHelp() {
    // Conditionally compile this code. Should not appear in production.
    if (process.env.NODE_ENV === 'development') {
      return <Help />;
    }

    return null;
  }

  render() {
    return (
      <footer
        className={classNames(styles.footer, {
          [styles.dashboardFooter]: this.props.location.pathname === '/dashboard',
        })}
      >
        {this.renderDebugMenu()}
        {this.renderHelp()}
      </footer>
    );
  }
}

export default Footer;
