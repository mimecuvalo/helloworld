export default {
  Query: {
    async allUsers(parent, args, { models, currentUser }) {
      return await models.User.findAll();
    },

    async fetchUser(parent, { id }, { models }) {
      return await models.User.findById(id);
    },
  },

  // Example stubs of mutations, non-functional out of the box.
  Mutation: {
    async login(parent, { email }, { models }) {
      const user = await models.User.findOne({ where: { email } });

      if (!user) {
        throw new Error('Login failed.');
      }
    },

    async createUser(parent, { username, email }, { models }) {
      return await models.User.create({ username, email });
    },
  },
};
