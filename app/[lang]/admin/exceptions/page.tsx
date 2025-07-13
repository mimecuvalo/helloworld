import { Metadata } from 'next';
import ExceptionsClient from './exceptions-client';
import AuthWrapper from '../auth-wrapper';

export const metadata: Metadata = {
  title: 'Admin - Exceptions',
  description: 'View system exceptions',
};

export default function ExceptionsPage() {
  return (
    <AuthWrapper>
      <ExceptionsClient />
    </AuthWrapper>
  );
}
