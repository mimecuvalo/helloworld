import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import React, { useEffect, useState } from 'react';
import styles from './Performance.module.css';

// Provides insight into how long the initial render took.
// Relies heavily on window['performance'] for now.
// Could be improved with some more server-side stats and with some metrics on
// ajax navigations.
export default function Performance() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [navigationEntry, setNavigationEntry] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  function calculatePerfInfo() {
    console.log('[perf]: calculating perf info...');
    if (window['performance']) {
      const navigationEntry = window['performance'].getEntriesByType('navigation')[0];
      setDuration(navigationEntry.duration);
      setNavigationEntry(navigationEntry);
    }
  }

  useEffect(() => {
    if (loaded) {
      return;
    }
    // Wait a tick until the page more or less finishes rendering.
    // XXX(mime): 100 is arbitrary. Look for better way to wait.
    setTimeout(() => calculatePerfInfo(), 100);
    setLoaded(true);
  }, [loaded]);

  function renderPerfInfo() {
    if (!navigationEntry || !anchorEl) {
      return null;
    }

    const timingsInOrder = [
      'redirectStart',
      'redirectEnd',
      'fetchStart',
      'domainLookupStart',
      'domainLookupEnd',
      'connectStart',
      'secureConnectionStart',
      'connectEnd',
      'requestStart',
      'responseStart',
      'responseEnd',
      'domInteractive',
      'domContentLoadedEventStart',
      'domContentLoadedEventEnd',
      'domComplete',
      'loadEventStart',
      'loadEventEnd',
    ];

    return (
      <table className={styles.performanceList}>
        {timingsInOrder
          .filter(timing => !!navigationEntry[timing])
          .map(timing => (
            <tr key={timing}>
              <td className={styles.entryType}>{timing}</td>
              <td className={styles.entryData}>{navigationEntry[timing].toFixed(1)}</td>
            </tr>
          ))}
      </table>
    );
  }

  const open = Boolean(anchorEl);

  return (
    <span>
      <Button
        aria-owns={open ? 'perf-info-popover' : undefined}
        aria-haspopup="true"
        variant="outlined"
        onClick={handleClick}
        className={duration > 5000 ? styles.slowPerformanceButton : styles.performanceButton}
      >
        {duration ? duration.toFixed(1) + 'ms' : '…'}
      </Button>
      <Popover
        id="perf-info-popover"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        {renderPerfInfo()}
      </Popover>
    </span>
  );
}
