import React, { PureComponent } from 'react';
import styles from './Header.module.css';

class Header extends PureComponent {
  render() {
    const { title } = this.props.contentRemote;

    return (
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </header>
    );
  }
}

export default Header;
