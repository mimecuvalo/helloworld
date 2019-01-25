import Feed from './Feed';
import Followers from './Followers';
import Following from './Following';
import React, { PureComponent } from 'react';
import styles from './Dashboard.module.css';
import Tools from './Tools';
import Unauthorized from '../error/401';
import UserContext from '../app/User_Context';

class Dashboard extends PureComponent {
  static contextType = UserContext;

  render() {
    if (!this.context.user) {
      return <Unauthorized />;
    }

    return (
      <div className={styles.container}>
        <nav className={styles.nav}>
          <Tools className={styles.tools} />
          <Following className={styles.following} />
          <Followers className={styles.followers} />
        </nav>

        <Feed className={styles.content} />
      </div>
    );
  }
}

export default Dashboard;
