import { Metadata } from 'next';
import ExperimentsClient from './experiments-client';
import AuthWrapper from '../auth-wrapper';

export const metadata: Metadata = {
  title: 'Admin - Experiments',
  description: 'View and manage experiments',
};

export default function ExperimentsPage() {
  return (
    <AuthWrapper>
      <ExperimentsClient />
    </AuthWrapper>
  );
}
