import { Accordion, AccordionDetails, AccordionSummary, Link, Typography, styled } from 'components';
import { useEffect, useState } from 'react';

import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import authServerSideProps from 'app/authServerSideProps';

const Container = styled('div')`
  max-width: 75vw;
  white-space: pre-wrap;
`;

const Results = styled('pre')`
  white-space: pre-wrap;
`;

export default function Exceptions() {
  const [clientExceptions, setClientExceptions] = useState({});
  const [serverExceptions, setServerExceptions] = useState({});

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
    <Container>
      <Typography variant="h1">Client Exceptions (today’s)</Typography>
      <ExceptionsDisplay exceptions={clientExceptions} />

      <Typography variant="h1">Server Exceptions (today’s)</Typography>
      <ExceptionsDisplay exceptions={serverExceptions} />

      <Typography variant="h1">Server Exceptions (on Sentry)</Typography>
      {process.env.SENTRY_DSN ? (
        <Link href="https://sentry.io/" target="_blank">
          View Sentry issues
        </Link>
      ) : (
        'process.env.SENTRY_DSN is not set.'
      )}
    </Container>
  );
}

type Exception = {
  [key: string]: string;
};

function ExceptionsDisplay({ exceptions }: { exceptions: Exception }) {
  const messages = Object.keys(exceptions);
  const sortedMessages = messages.sort((a, b) => exceptions[b].length - exceptions[a].length);

  return sortedMessages.length ? (
    <>
      {sortedMessages.map((msg, idx) => (
        <Accordion key={idx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${idx}-content`} id={`${idx}-header`}>
            <Typography variant="body1">
              <strong>{exceptions[msg].length}</strong>: {msg}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Results>{JSON.stringify(exceptions[msg], undefined, 2).replace(/\\n/g, '\n')}</Results>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  ) : (
    <div>No exceptions today (yet).</div>
  );
}

export const getServerSideProps = authServerSideProps();
