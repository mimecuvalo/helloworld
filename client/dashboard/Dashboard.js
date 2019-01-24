import Feed from './Feed';
import Followers from './Followers';
import Following from './Following';
import React, { PureComponent } from 'react';
import styles from './Dashboard.module.css';
import Tools from './Tools';

class Dashboard extends PureComponent {

  render() {
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
