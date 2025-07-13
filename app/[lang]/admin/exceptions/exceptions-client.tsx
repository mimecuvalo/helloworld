'use client';

import { Accordion, AccordionDetails, AccordionSummary, Link, Typography, styled } from 'components';
import { useEffect, useState } from 'react';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const Container = styled('div')`
  max-width: 75vw;
  white-space: pre-wrap;
`;

const Results = styled('pre')`
  white-space: pre-wrap;
`;

export default function ExceptionsClient() {
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
      <Typography variant="h1">Exceptions</Typography>
      <Link href="/admin">← Back to Admin</Link>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h3">Client Exceptions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Results>{JSON.stringify(clientExceptions, undefined, 2)}</Results>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h3">Server Exceptions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Results>{JSON.stringify(serverExceptions, undefined, 2)}</Results>
        </AccordionDetails>
      </Accordion>
    </Container>
  );
}
