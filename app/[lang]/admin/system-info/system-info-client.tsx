'use client';

import { Typography } from 'components';
import { useEffect, useState } from 'react';

export default function SystemInfoClient() {
  const [systemInfo, setSystemInfo] = useState({});

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/admin/system-info');
      const json = await response.json();
      setSystemInfo(json);
    }
    fetchData();
  }, []);

  return (
    <>
      <Typography variant="h1">System Info</Typography>
      <pre>{JSON.stringify(systemInfo, undefined, 2)}</pre>
    </>
  );
}
