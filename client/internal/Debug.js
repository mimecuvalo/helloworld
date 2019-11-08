import A11y from './A11y';
import Performance from './Performance';
import React from 'react';
import styles from './Debug.module.css';

export default function DebugTray() {
  return (
    <div className={styles.debug}>
      <A11y />
      <Performance />
    </div>
  );
}
