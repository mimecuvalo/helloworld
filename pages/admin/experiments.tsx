import { useEffect, useState } from 'react';

import { Typography } from 'components';
import authServerSideProps from 'app/authServerSideProps';

export default function Experiments() {
  const [experiments, setExperiments] = useState({});

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/admin/experiments');
      const json = await response.json();
      setExperiments(json.experiments);
    }
    fetchData();
  }, [setExperiments]);

  return (
    <>
      <Typography variant="h1">Experiments</Typography>
      <pre>{JSON.stringify(experiments, undefined, 2)}</pre>
    </>
  );
}

export const getServerSideProps = authServerSideProps();
