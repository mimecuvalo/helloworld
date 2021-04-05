import axe from 'axe-core';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
import Popover from '@material-ui/core/Popover';
import { useEffect, useState } from 'react';

const useStyles = createUseStyles({
  a11yPopover: {
    padding: '10px',
    maxWidth: '40vw',
    maxHeight: '40vh',
  },

  typeFilter: {
    textTransform: 'capitalize',
  },

  a11yViolations: {
    color: 'red',
  },

  rerun: {
    position: 'absolute',
    top: '10px',
    right: '10px',
  },
});

// Provides information about the app's shortcomings when it comes to accessibility.
// This uses the `axe-core` package underneath to provide the info.
// Should only be used and run in development.
export default function A11y() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const [results, setResults] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const styles = useStyles();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRerun = (event) => {
    setErrorCount(0);
    setResults(null);
    setLoaded(false);
  };

  useEffect(() => {
    if (loaded) {
      return;
    }
    // Wait a tick until the page more or less finishes rendering to make sure this doesn't block
    // the app's main functionality.
    setTimeout(() => runAudit(), 0);
    setLoaded(true);
  }, [loaded]);

  function runAudit() {
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
        setErrorCount(results.violations.length);
        setResults(results);
      }
    );
  }

  function renderViolationByType(typeFilter) {
    const violationsByType = results.violations.filter((violation) => violation.impact === typeFilter);
    if (!violationsByType.length) {
      return null;
    }

    return (
      <div>
        <h3 className={styles.typeFilter}>{typeFilter}</h3>
        <ul>
          {violationsByType.map((violation) => (
            <li key={violation.id}>
              <strong>{violation.id}</strong>: {violation.description}
              &nbsp;(
              <em>{violation.nodes.map((node) => node.target).join(', ')}</em>)
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderResults() {
    if (!results || !anchorEl) {
      return null;
    }

    return (
      <div className={styles.a11yPopover}>
        <Button variant="contained" onClick={handleRerun} className={styles.rerun}>
          Re-run audits
        </Button>
        <h2>Violations</h2>
        {results.violations.length ? null : (
          <div>
            No violations!
            <br />
            <br />
          </div>
        )}
        {renderViolationByType('critical')}
        {renderViolationByType('serious')}
        {renderViolationByType('moderate')}
        {renderViolationByType('minor')}
        <strong>Passing tests</strong>: {results.passes.length}
        <br />
        <strong>Inapplicable tests</strong>: {results.inapplicable.length}
        <br />
        <strong>See console output for more detailed information.</strong>
        <br />
        <br />
      </div>
    );
  }

  const open = Boolean(anchorEl);

  return (
    <span>
      <Button
        aria-owns={open ? 'a11y-info-popover' : undefined}
        aria-haspopup="true"
        variant="outlined"
        onClick={handleClick}
        className={classNames(errorCount ? styles.a11yViolations : null, 'i18n-msg')}
      >
        a11y ({errorCount})
      </Button>
      <Popover
        id="a11y-info-popover"
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
        {renderResults()}
      </Popover>
    </span>
  );
}
