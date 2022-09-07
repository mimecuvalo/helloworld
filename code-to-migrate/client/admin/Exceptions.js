import { useEffect, useState } from 'react';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  root: {
    maxWidth: '75vw',
    whiteSpace: 'pre-wrap',
  },
  pre: {
    whiteSpace: 'pre-wrap',
  },
  ul: {
    listStyle: 'none',
    padding: '0',
    '& li': {
      margin: '5px 0',
    },
  },
});

export default function Exceptions() {
  const [clientExceptions, setClientExceptions] = useState({});
  const [serverExceptions, setServerExceptions] = useState({});
  const styles = useStyles();

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/admin/list-exceptions');
      const json = await response.json();
      setClientExceptions(json.clientExceptions);
      setServerExceptions(json.serverExceptions);
    }
    fetchData();
  }, [setClientExceptions, setServerExceptions]);

  // TODO(mime): Either have a Sentry embed or a way to look at server exceptions locally.
  return (
    <div className={styles.root}>
      <h1>Client Exceptions (today's)</h1>
      <ExceptionsDisplay exceptions={clientExceptions} />

      <h1>Server Exceptions (today's)</h1>
      <ExceptionsDisplay exceptions={serverExceptions} />

      <h1>Server Exceptions (on Sentry)</h1>
      {process.env.REACT_APP_SENTRY_DSN ? (
        <a href="https://sentry.io/" target="_blank" rel="noopener noreferrer">
          View Sentry issues
        </a>
      ) : (
        'process.env.REACT_APP_SENTRY_DSN is not set.'
      )}
    </div>
  );
}

function ExceptionsDisplay({ exceptions }) {
  const styles = useStyles();

  const messages = Object.keys(exceptions);
  const sortedMessages = messages.sort((a, b) => exceptions[b].length - exceptions[a].length);

  return sortedMessages.length ? (
    sortedMessages.map((msg, idx) => (
      <ExpansionPanel key={idx}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${idx}-content`} id={`${idx}-header`}>
          <Typography>
            <strong>{exceptions[msg].length}</strong>: {msg}
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <pre className={styles.pre}>{JSON.stringify(exceptions[msg], undefined, 2).replace(/\\n/g, '\n')}</pre>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    ))
  ) : (
    <div>No exceptions today (yet).</div>
  );
}
