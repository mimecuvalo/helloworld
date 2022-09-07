import { Button, Popover } from '@mui/material';
import { MouseEvent, useEffect, useState } from 'react';

import axe from 'axe-core';
import { styled } from '@mui/material/styles';

const Container = styled('div')`
  padding: 10px;
  max-width: 40vw;
  max-height: 40vh;
`;

const TypeFilter = styled('h3')`
  text-transform: capitalize;
`;

const AuditButton = styled(Button)`
  position: absolute;
  top: 10px;
  right: 10px;
`;

// Provides information about the app's shortcomings when it comes to accessibility.
// This uses the `axe-core` package underneath to provide the info.
// Should only be used and run in development.
export default function A11y() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [results, setResults] = useState<axe.AxeResults | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRerun = () => {
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
    axe.run(document, {}, (err, results) => {
      if (err) throw err;
      console.log('[a11y]:', results);
      setErrorCount(results.violations.length);
      setResults(results);
    });
  }

  function renderViolationByType(typeFilter: string) {
    const violationsByType = results?.violations.filter((violation) => violation.impact === typeFilter);
    if (!violationsByType?.length) {
      return null;
    }

    return (
      <div>
        <TypeFilter>{typeFilter}</TypeFilter>
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
      <Container>
        <AuditButton variant="contained" onClick={handleRerun}>
          Re-run audits
        </AuditButton>
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
      </Container>
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
        className="notranslate"
        color={errorCount ? 'error' : undefined}
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
