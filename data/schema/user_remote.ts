import { gql } from '@apollo/client';

export default gql`
  type UserRemotePrivate {
    localUsername: String!
    username: String!
    name: String!
    profileUrl: String!
    salmonUrl: String
    activityPubActorUrl: String
    activityPubInboxUrl: String
    webmentionUrl: String
    magicKey: String
    follower: Boolean!
    following: Boolean!
    feedUrl: String!
    hubUrl: String
    avatar: String!
    favicon: String
    sortType: String
    order: Int!
  }

  type UserRemotePublic {
    localUsername: String!
    username: String!
    name: String!
    profileUrl: String!
    salmonUrl: String
    activityPubActorUrl: String
    activityPubInboxUrl: String
    webmentionUrl: String
    magicKey: String
    follower: Boolean!
    following: Boolean!
    feedUrl: String!
    hubUrl: String
    avatar: String!
    favicon: String
    sortType: String
  }

  extend type Query {
    allUsersRemote: [UserRemotePrivate!]!
    fetchUserRemote(id: Int!): UserRemotePrivate
    fetchFollowers: [UserRemotePublic!]!
    fetchFollowing: [UserRemotePublic!]!
  }

  extend type Mutation {
    createUserRemote(profileUrl: String!): UserRemotePublic
    toggleSortFeed(profileUrl: String!, currentSortType: String!): UserRemotePublic!
    destroyFeed(profileUrl: String!): Boolean!
  }
`;
