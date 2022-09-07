import { Container, List, ListItem } from '@mui/material';

import Link from 'next/link';
import authServerSideProps from 'app/authServerSideProps';

export default function AdminApp() {
  return (
    <Container>
      <List className="notranslate">
        <ListItem>
          <Link href="/admin" passHref>
            <a>System Info</a>
          </Link>
        </ListItem>
        <ListItem>
          <Link href="/admin/exceptions" passHref>
            <a>Exceptions</a>
          </Link>
        </ListItem>
        <ListItem>
          <Link href="/admin/experiments" passHref>
            <a>Experiments</a>
          </Link>
        </ListItem>
        <ListItem>
          <Link href="/admin/repl" passHref>
            <a>REPL</a>
          </Link>
        </ListItem>
      </List>
    </Container>
  );
}

export const getServerSideProps = authServerSideProps();
