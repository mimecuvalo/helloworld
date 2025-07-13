import { Container, Link, List, ListItem } from 'components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Administration panel',
};

export default function AdminApp() {
  return (
    <Container>
      <List className="notranslate">
        <ListItem>
          <Link href="/admin/system-info">System Info</Link>
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
        <ListItem>
          <Link href="/admin/users">Users</Link>
        </ListItem>
      </List>
    </Container>
  );
}
