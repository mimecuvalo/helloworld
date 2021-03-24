import gql from 'graphql-tag';

const LOCAL_STATE = {
  user: undefined,
  experiments: undefined,
};

export const typeDefs = gql`
  type Experiment {
    name: String!
  }

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
    experiments: [Experiment!]!
    user: User!
  }

  type Query {
    experiments: [Experiment!]!
    user: User!
  }

  type Mutation {
    updateExperiments(experiments: [Experiment!]!): [Experiment!]!
    updateUser(user: User!): User!
  }
`;

export const resolvers = {
  Query: {
    experiments: () => LOCAL_STATE.experiments,
    user: () => LOCAL_STATE.user,
  },
  Mutation: {
    updateExperiments: (_, { experiments }) => {
      LOCAL_STATE.experiments = experiments.map(name => ({
        __typename: 'Experiment',
        name,
      }));
      return experiments;
    },
    updateUser: (_, { user }) => {
      LOCAL_STATE.user = user;
      return user;
    },
  },
};

export function initializeLocalState(user, experiments) {
  LOCAL_STATE.user = user && {
    __typename: 'User',
    model: Object.assign({ __typename: 'UserModel' }, user.model),
    oauth: Object.assign({ __typename: 'UserOAuth' }, user.oauth),
  };

  LOCAL_STATE.experiments =
    experiments &&
    experiments.map(name => ({
      __typename: 'Experiment',
      name,
    }));
}
