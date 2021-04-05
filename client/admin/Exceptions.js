import { createUseStyles } from 'react-jss';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import { useEffect, useState } from 'react';
import Typography from '@material-ui/core/Typography';

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
  const styles = useStyles();

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/admin/clientside-exceptions');
      const json = await response.json();
      setClientExceptions(json.exceptions);
    }
    fetchData();
  }, [setClientExceptions]);

  const messages = Object.keys(clientExceptions);
  const sortedMessages = messages.sort((a, b) => clientExceptions[b].length - clientExceptions[a].length);

  // TODO(mime): Either have a Sentry embed or a way to look at server exceptions locally.
  return (
    <div className={styles.root}>
      <h1>Client Exceptions (today's)</h1>
      {sortedMessages.length ? (
        sortedMessages.map((msg, idx) => (
          <ExpansionPanel key={idx}>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${idx}-content`}
              id={`${idx}-header`}
            >
              <Typography>
                <strong>{clientExceptions[msg].length}</strong>: {msg}
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <pre className={styles.pre}>
                {JSON.stringify(clientExceptions[msg], undefined, 2).replace(/\\n/g, '\n')}
              </pre>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        ))
      ) : (
        <div>No exceptions today (yet).</div>
      )}

      <h1>Server Exceptions</h1>
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
