import { Metadata } from 'next';
import UsersClient from './users-client';
import AuthWrapper from '../auth-wrapper';

export const metadata: Metadata = {
  title: 'Admin - Users',
  description: 'View and manage users',
};

export default function UsersPage() {
  return (
    <AuthWrapper>
      <UsersClient />
    </AuthWrapper>
  );
}
