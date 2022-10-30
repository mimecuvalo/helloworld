import { Container, Link, List, ListItem } from 'components';

import authServerSideProps from 'app/authServerSideProps';

export default function AdminApp() {
  return (
    <Container>
      <List className="notranslate">
        <ListItem>
          <Link href="/admin">System Info</Link>
        </ListItem>
        <ListItem>
          <Link href="/admin/exceptions">Exceptions</Link>
        </ListItem>
        <ListItem>
          <Link href="/admin/experiments">Experiments</Link>
        </ListItem>
        <ListItem>
          <Link href="/admin/repl">REPL</Link>
        </ListItem>
      </List>
    </Container>
  );
}

export const getServerSideProps = authServerSideProps();
