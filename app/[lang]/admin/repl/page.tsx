import { Metadata } from 'next';
import ReplClient from './repl-client';
import AuthWrapper from '../auth-wrapper';

export const metadata: Metadata = {
  title: 'Admin - REPL',
  description: 'Interactive REPL console',
};

export default function ReplPage() {
  return (
    <AuthWrapper>
      <ReplClient />
    </AuthWrapper>
  );
}
