import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';

const User = {
  Query: {
    users: combineResolvers(isAdmin, async () => {
      return await prisma?.user.findMany();
    }),
  },

  Mutation: {
    createUser: combineResolvers(isAdmin, async () => {
      // Your code here...
    }),
  },
};
export default User;
