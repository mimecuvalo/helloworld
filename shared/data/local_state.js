import gql from 'graphql-tag';

const LOCAL_STATE = {
  user: undefined,
};

export const typeDefs = gql`
  type UserModel {
    username: String!
    name: String!
    email: String!
    title: String!
    description: String
    license: String
    google_analytics: String
    magic_key: String!
    favicon: String
    logo: String
    theme: String!
    viewport: String
    sidebar_html: String
  }

  type UserOAuth {
    email: String!
    picture: String
  }

  type User {
    model: UserModel!
    oauth: UserOAuth!
  }

  type App {
    user: User!
  }

  type Query {
    user: User!
  }

  type Mutation {
    updateUser(user: User!): User!
  }
`;

export const resolvers = {
  Query: {
    user: () => LOCAL_STATE.user,
  },
  Mutation: {
    updateUser: (_, { user }) => {
      LOCAL_STATE.user = user;
      return user;
    },
  },
};

export function initializeCurrentUser(user) {
  LOCAL_STATE.user = user && {
    __typename: 'User',
    model: Object.assign({ __typename: 'UserModel' }, user.model),
    oauth: Object.assign({ __typename: 'UserOAuth' }, user.oauth),
  };
}
