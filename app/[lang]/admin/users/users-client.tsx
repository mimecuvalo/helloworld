'use client';

import { Typography } from 'components';
import { useEffect, useState } from 'react';

export default function UsersClient() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/admin/users');
      const json = await response.json();
      setUsers(json.users || []);
    }
    fetchData();
  }, []);

  return (
    <>
      <Typography variant="h1">Users</Typography>
      <pre>{JSON.stringify(users, undefined, 2)}</pre>
    </>
  );
}
