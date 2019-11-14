import A11y from './A11y';
import { createUseStyles } from 'react-jss';
import Performance from './Performance';
import React from 'react';

const useStyles = createUseStyles({
  debug: {
    whiteSpace: 'nowrap',
    display: 'inline-block',
  },
});

export default function DebugTray() {
  const styles = useStyles();

  return (
    <div className={styles.debug}>
      <A11y />
      <Performance />
    </div>
  );
}
