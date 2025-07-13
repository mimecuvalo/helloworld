import { Metadata } from 'next';
import SystemInfoClient from './system-info-client';
import AuthWrapper from '../auth-wrapper';

export const metadata: Metadata = {
  title: 'Admin - System Info',
  description: 'View system information',
};

export default function SystemInfoPage() {
  return (
    <AuthWrapper>
      <SystemInfoClient />
    </AuthWrapper>
  );
}
