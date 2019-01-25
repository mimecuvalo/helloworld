import axe from 'axe-core';
import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import React, { PureComponent } from 'react';
import styles from './A11y.module.css';

// Provides information about the app's shortcomings when it comes to accessibility.
// This uses the `axe-core` package underneath to provide the info.
// Should only be used and run in development.
export default class A11y extends PureComponent {
  constructor() {
    super();

    this.state = {
      anchorEl: null,
      errorCount: 0,
      results: null,
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

  handleRerun = event => {
    this.setState({ errorCount: 0, results: null }, () => this.runAudit());
  };

  componentDidMount() {
    // Wait a tick until the page more or less finishes rendering to make sure this doesn't block
    // the app's main functionality.
    setTimeout(() => this.runAudit(), 0);
  }

  runAudit() {
    console.log('[a11y]: running accessibility audit...');
    axe.run(
      document,
      {
        rules: {
          // This is a very annoying property of color-contrast that causes the page to scroll on page load.
          // We disable it here. This 'options' structure is insane btw. wtf.
          'color-contrast': { checks: { 'color-contrast': { options: { noScroll: true } } } },
        },
      },
      (err, results) => {
        if (err) throw err;
        console.log('[a11y]:', results);
        this.setState({
          errorCount: results.violations.length,
          results,
        });
      }
    );
  }

  renderViolationByType(typeFilter) {
    const violationsByType = this.state.results.violations.filter(violation => violation.impact === typeFilter);
    if (!violationsByType.length) {
      return null;
    }

    return (
      <div>
        <br />
        <h3 className={styles.typeFilter}>{typeFilter}</h3>
        <ul>
          {violationsByType.map(violation => (
            <li key={violation.id}>
              <strong>{violation.id}</strong>: {violation.description}
              &nbsp;(
              <em>{violation.nodes.map(node => node.target).join(', ')}</em>)
            </li>
          ))}
        </ul>
        <br />
      </div>
    );
  }

  renderResults() {
    if (!this.state.results || !this.state.anchorEl) {
      return null;
    }

    return (
      <div className={styles.a11yPopover}>
        <Button variant="contained" onClick={this.handleRerun} className={styles.rerun}>
          Re-run audits
        </Button>
        <h2>Violations</h2>
        {this.state.results.violations.length ? null : (
          <div>
            No violations!
            <br />
            <br />
          </div>
        )}
        {this.renderViolationByType('critical')}
        {this.renderViolationByType('serious')}
        {this.renderViolationByType('moderate')}
        {this.renderViolationByType('minor')}
        <br />
        <strong>Passing tests</strong>: {this.state.results.passes.length}
        <br />
        <strong>Inapplicable tests</strong>: {this.state.results.inapplicable.length}
        <br />
        <strong>See console output for more detailed information.</strong>
        <br />
        <br />
      </div>
    );
  }

  render() {
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    return (
      <span>
        <Button
          aria-owns={open ? 'a11y-info-popover' : undefined}
          aria-haspopup="true"
          variant="outlined"
          onClick={this.handleClick}
          className={this.state.errorCount ? styles.a11yViolations : null}
        >
          a11y ({this.state.errorCount})
        </Button>
        <Popover
          id="a11y-info-popover"
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
          {this.renderResults()}
        </Popover>
      </span>
    );
  }
}
