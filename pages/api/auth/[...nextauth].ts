import NextAuth from 'next-auth';
import { authOptions } from '../../../util/auth';

export default NextAuth(authOptions);
