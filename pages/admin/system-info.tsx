import { Typography } from 'components';
import authServerSideProps from 'app/authServerSideProps';

export default function SystemInfo() {
  return (
    <>
      <Typography variant="h1">System Info</Typography>
      <pre>
        NODE_ENV: {process.env.NODE_ENV}
        <br />
        TODOS:
        <br />
        - CPU/Memory info
        <br />
        - other useful info...
        <br />
      </pre>
    </>
  );
}

export const getServerSideProps = authServerSideProps();
