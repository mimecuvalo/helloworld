import { Button, List, ListItem, Popover, Typography, styled } from 'components';
import { MouseEvent, useEffect, useState } from 'react';

import axe from 'axe-core';

const Container = styled('div')`
  padding: ${(props) => props.theme.spacing(1)};
  max-width: 80vw;
  max-height: 80vh;
`;

const TypeFilter = styled(Typography)`
  text-transform: capitalize;
`;

const AuditButton = styled(Button)`
  position: absolute;
  top: ${(props) => props.theme.spacing(1)};
  right: ${(props) => props.theme.spacing(1)};
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
    const timeoutId = setTimeout(() => runAudit(), 0);
    setLoaded(true);

    return () => clearTimeout(timeoutId);
  }, [loaded]);

  function runAudit() {
    console.debug('[a11y]: running accessibility audit...');

    try {
      axe.run(document, {}, (err, results) => {
        if (err) throw err;
        console.debug('[a11y]:', results);
        setErrorCount(results.violations.length + results.incomplete.length);
        setResults(results);
      });
    } catch (ex) {
      console.error(ex);
    }
  }

  function renderIssueByType(typeFilter: string) {
    if (!results) return null;
    const { violations, incomplete } = results;
    const allIssues = [
      ...violations.map((v) => ({ ...v, type: 'violation' })),
      ...incomplete.map((i) => ({ ...i, type: 'incomplete' })),
    ];
    const issuesByType = allIssues.filter((issue) => issue.impact === typeFilter);
    if (!issuesByType?.length) {
      return null;
    }

    const handleMouseOver = (target: string) => {
      document.querySelector(target)?.setAttribute('style', 'outline: 3px solid hotpink');
    };
    const handleMouseOut = (target: string) => {
      document.querySelector(target)?.setAttribute('style', '');
    };

    return (
      <div>
        <TypeFilter variant="h3">{typeFilter}</TypeFilter>
        <List>
          {issuesByType.map((issue) => (
            <ListItem key={issue.id} sx={{ mb: 2 }}>
              <strong style={{ minWidth: '200px' }}>
                {issue.type === 'violation' ? '⚠️ Violation' : '⚙️ Incomplete'}
              </strong>
              <strong style={{ minWidth: '200px' }}>{issue.id}</strong>
              <span style={{ minWidth: '200px' }}>{issue.description}</span>
              &nbsp;
              <em style={{ minWidth: '200px' }}>
                <pre>
                  {issue.nodes.map((node, idx) => (
                    <div
                      key={idx}
                      onMouseOver={() => handleMouseOver(node.target as unknown as string)}
                      onMouseOut={() => handleMouseOut(node.target as unknown as string)}
                    >
                      {node.target}
                    </div>
                  ))}
                </pre>
              </em>
              <span style={{ minWidth: '200px' }}>
                {issue.helpUrl ? (
                  <a href={issue.helpUrl} target="_blank" rel="noopener noreferrer">
                    More info
                  </a>
                ) : (
                  <span>No more info</span>
                )}
              </span>
            </ListItem>
          ))}
        </List>
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
        <Typography variant="h2">Issues</Typography>
        {results.violations.length || results.incomplete.length ? null : (
          <div>
            No issues!
            <br />
            <br />
          </div>
        )}
        {renderIssueByType('critical')}
        {renderIssueByType('serious')}
        {renderIssueByType('moderate')}
        {renderIssueByType('minor')}
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
