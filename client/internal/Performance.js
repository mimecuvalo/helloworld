import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import React, { PureComponent } from 'react';
import styles from './Performance.module.css';

// Provides insight into how long the initial render took.
// Relies heavily on window['performance'] for now.
// Could be improved with some more server-side stats and with some metrics on
// ajax navigations.
export default class Performance extends PureComponent {
  constructor() {
    super();

    this.state = {
      anchorEl: null,
      duration: 0,
      navigationEntry: null,
    };
  }

  handleClick = event => {
    this.setState({
      anchorEl: event.currentTarget,
    });
  };

  handleClose = () => {
    this.setState({
      anchorEl: null,
    });
  };

  calculatePerfInfo() {
    console.log('[perf]: calculating perf info...');
    if (window['performance']) {
      const navigationEntry = window['performance'].getEntriesByType('navigation')[0];
      this.setState({
        duration: navigationEntry.duration,
        navigationEntry,
      });
    }
  }

  componentDidMount() {
    // Wait a tick until the page more or less finishes rendering.
    setTimeout(() => this.calculatePerfInfo(), 0);
  }

  renderPerfInfo() {
    if (!this.state.navigationEntry || !this.state.anchorEl) {
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
        {timingsInOrder.filter(timing => !!this.state.navigationEntry[timing]).map(timing => (
          <tr key={timing}>
            <td className={styles.entryType}>{timing}</td>
            <td className={styles.entryData}>{this.state.navigationEntry[timing].toFixed(1)}</td>
          </tr>
        ))}
      </table>
    );
  }

  render() {
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    return (
      <span>
        <Button
          aria-owns={open ? 'perf-info-popover' : undefined}
          aria-haspopup="true"
          variant="outlined"
          onClick={this.handleClick}
          className={this.state.duration > 5000 ? styles.slowPerformanceButton : styles.performanceButton}
        >
          {this.state.duration ? this.state.duration.toFixed(1) + 'ms' : '…'}
        </Button>
        <Popover
          id="perf-info-popover"
          open={open}
          anchorEl={anchorEl}
          onClose={this.handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        >
          {this.renderPerfInfo()}
        </Popover>
      </span>
    );
  }
}
