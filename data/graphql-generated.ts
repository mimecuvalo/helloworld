// NOTE This file is auto-generated via yarn codegen - DO NOT EDIT DIRECTLY!
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from './context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
};

export type Comment = ContentRemote & {
  __typename?: 'Comment';
  avatar?: Maybe<Scalars['String']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  creator?: Maybe<Scalars['String']['output']>;
  deleted: Scalars['Boolean']['output'];
  favorited: Scalars['Boolean']['output'];
  fromUsername?: Maybe<Scalars['String']['output']>;
  link: Scalars['String']['output'];
  localContentName?: Maybe<Scalars['String']['output']>;
  postId: Scalars['String']['output'];
  toUsername: Scalars['String']['output'];
  type: Scalars['String']['output'];
  username: Scalars['String']['output'];
  view: Scalars['String']['output'];
};

export type Content = {
  __typename?: 'Content';
  album: Scalars['String']['output'];
  avatar?: Maybe<Scalars['String']['output']>;
  code: Scalars['String']['output'];
  commentsCount: Scalars['Int']['output'];
  commentsUpdated?: Maybe<Scalars['Date']['output']>;
  content: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  countRobot: Scalars['Int']['output'];
  createdAt: Scalars['Date']['output'];
  externalLink?: Maybe<Scalars['String']['output']>;
  favorited: Scalars['Boolean']['output'];
  forceRefresh?: Maybe<Scalars['Boolean']['output']>;
  hidden: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  prefetchImages?: Maybe<Array<Scalars['String']['output']>>;
  redirect: Scalars['Int']['output'];
  section: Scalars['String']['output'];
  sortType?: Maybe<Scalars['String']['output']>;
  style: Scalars['String']['output'];
  template: Scalars['String']['output'];
  thread?: Maybe<Scalars['String']['output']>;
  threadUser?: Maybe<Scalars['String']['output']>;
  thumb: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  username: Scalars['String']['output'];
  view: Scalars['String']['output'];
};

export type ContentMetaInfo = {
  __typename?: 'ContentMetaInfo';
  album: Scalars['String']['output'];
  externalLink?: Maybe<Scalars['String']['output']>;
  forceRefresh: Scalars['Boolean']['output'];
  hidden: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  prefetchImages?: Maybe<Array<Scalars['String']['output']>>;
  section: Scalars['String']['output'];
  template: Scalars['String']['output'];
  thumb: Scalars['String']['output'];
  title: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type ContentRemote = {
  avatar?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  favorited: Scalars['Boolean']['output'];
  fromUsername?: Maybe<Scalars['String']['output']>;
  localContentName?: Maybe<Scalars['String']['output']>;
  postId: Scalars['String']['output'];
  toUsername: Scalars['String']['output'];
  type: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type Echo = {
  __typename?: 'Echo';
  exampleField: Scalars['String']['output'];
};

export type Favorite = ContentRemote & {
  __typename?: 'Favorite';
  avatar?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  deleted: Scalars['Boolean']['output'];
  favorited: Scalars['Boolean']['output'];
  fromUsername?: Maybe<Scalars['String']['output']>;
  localContentName?: Maybe<Scalars['String']['output']>;
  postId: Scalars['String']['output'];
  toUsername: Scalars['String']['output'];
  type: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type FeedCount = {
  __typename?: 'FeedCount';
  count: Scalars['Int']['output'];
  fromUsername: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _?: Maybe<Scalars['Boolean']['output']>;
  createUser?: Maybe<UserPrivate>;
  createUserRemote?: Maybe<UserRemotePublic>;
  deleteContent: Scalars['Boolean']['output'];
  deleteContentRemote: ContentRemote;
  destroyFeed: Scalars['Boolean']['output'];
  favoriteContentRemote: ContentRemote;
  markAllContentInFeedAsRead: FeedCount;
  markAllFeedsAsRead: FeedCount;
  postComment: Comment;
  postContent: Content;
  readContentRemote: Post;
  saveContent: Content;
  toggleSortFeed: UserRemotePublic;
};


export type MutationCreateUserArgs = {
  email: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationCreateUserRemoteArgs = {
  profileUrl: Scalars['String']['input'];
};


export type MutationDeleteContentArgs = {
  name: Scalars['String']['input'];
};


export type MutationDeleteContentRemoteArgs = {
  deleted: Scalars['Boolean']['input'];
  fromUsername: Scalars['String']['input'];
  localContentName: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type MutationDestroyFeedArgs = {
  profileUrl: Scalars['String']['input'];
};


export type MutationFavoriteContentRemoteArgs = {
  favorited: Scalars['Boolean']['input'];
  fromUsername: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type MutationMarkAllContentInFeedAsReadArgs = {
  fromUsername: Scalars['String']['input'];
};


export type MutationPostCommentArgs = {
  content: Scalars['String']['input'];
  name: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationPostContentArgs = {
  album: Scalars['String']['input'];
  code: Scalars['String']['input'];
  content: Scalars['String']['input'];
  hidden: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  section: Scalars['String']['input'];
  style: Scalars['String']['input'];
  thumb: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationReadContentRemoteArgs = {
  fromUsername: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  read: Scalars['Boolean']['input'];
};


export type MutationSaveContentArgs = {
  code: Scalars['String']['input'];
  content: Scalars['String']['input'];
  hidden: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  style: Scalars['String']['input'];
  thumb: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationToggleSortFeedArgs = {
  currentSortType: Scalars['String']['input'];
  profileUrl: Scalars['String']['input'];
};

export type Neighbors = {
  __typename?: 'Neighbors';
  first?: Maybe<ContentMetaInfo>;
  last?: Maybe<ContentMetaInfo>;
  next?: Maybe<ContentMetaInfo>;
  prev?: Maybe<ContentMetaInfo>;
  top?: Maybe<ContentMetaInfo>;
};

export type Post = ContentRemote & {
  __typename?: 'Post';
  avatar?: Maybe<Scalars['String']['output']>;
  commentUser?: Maybe<Scalars['String']['output']>;
  commentsCount: Scalars['Int']['output'];
  commentsUpdated?: Maybe<Scalars['Date']['output']>;
  createdAt: Scalars['Date']['output'];
  creator?: Maybe<Scalars['String']['output']>;
  deleted: Scalars['Boolean']['output'];
  favorited: Scalars['Boolean']['output'];
  fromUsername?: Maybe<Scalars['String']['output']>;
  isSpam: Scalars['Boolean']['output'];
  link: Scalars['String']['output'];
  localContentName?: Maybe<Scalars['String']['output']>;
  postId: Scalars['String']['output'];
  read: Scalars['Boolean']['output'];
  thread?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  toUsername: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['Date']['output']>;
  username: Scalars['String']['output'];
  view: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  _?: Maybe<Scalars['Boolean']['output']>;
  allContent: Array<Content>;
  allContentRemote: Array<ContentRemote>;
  allUsersRemote: Array<UserRemotePrivate>;
  currentUser?: Maybe<UserPrivate>;
  echoExample?: Maybe<Echo>;
  fetchAllUsers: Array<UserPrivate>;
  fetchCollection: Array<ContentMetaInfo>;
  fetchCollectionLatest?: Maybe<Content>;
  fetchCollectionPaginated: Array<Content>;
  fetchCommentsRemote: Array<Comment>;
  fetchContent?: Maybe<Content>;
  fetchContentNeighbors?: Maybe<Neighbors>;
  fetchContentRemote?: Maybe<ContentRemote>;
  fetchContentRemotePaginated: Array<Post>;
  fetchFavoritesRemote: Array<Favorite>;
  fetchFeedCounts: Array<FeedCount>;
  fetchFollowers: Array<UserRemotePublic>;
  fetchFollowing: Array<UserRemotePublic>;
  fetchPublicUserData?: Maybe<UserPublic>;
  fetchPublicUserDataSearch?: Maybe<UserPublic>;
  fetchSiteMap: Array<ContentMetaInfo>;
  fetchUser?: Maybe<UserPrivate>;
  fetchUserRemote?: Maybe<UserRemotePrivate>;
  fetchUserTotalCounts: UserCounts;
  hello?: Maybe<Scalars['String']['output']>;
  searchContent: Array<SearchContentMetaInfo>;
};


export type QueryEchoExampleArgs = {
  str: Scalars['String']['input'];
};


export type QueryFetchCollectionArgs = {
  album: Scalars['String']['input'];
  name: Scalars['String']['input'];
  section: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type QueryFetchCollectionLatestArgs = {
  name: Scalars['String']['input'];
  section: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type QueryFetchCollectionPaginatedArgs = {
  name: Scalars['String']['input'];
  offset: Scalars['Int']['input'];
  section: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type QueryFetchCommentsRemoteArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchContentArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchContentNeighborsArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchContentRemoteArgs = {
  id: Scalars['Int']['input'];
};


export type QueryFetchContentRemotePaginatedArgs = {
  offset: Scalars['Int']['input'];
  profileUrlOrSpecialFeed: Scalars['String']['input'];
  query?: InputMaybe<Scalars['String']['input']>;
  shouldShowAllItems?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryFetchFavoritesRemoteArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchPublicUserDataArgs = {
  username?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchPublicUserDataSearchArgs = {
  username?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchSiteMapArgs = {
  username: Scalars['String']['input'];
};


export type QueryFetchUserArgs = {
  id: Scalars['Int']['input'];
};


export type QueryFetchUserRemoteArgs = {
  id: Scalars['Int']['input'];
};


export type QuerySearchContentArgs = {
  query: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type SearchContentMetaInfo = {
  __typename?: 'SearchContentMetaInfo';
  album: Scalars['String']['output'];
  forceRefresh: Scalars['Boolean']['output'];
  hidden: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  preview: Scalars['String']['output'];
  section: Scalars['String']['output'];
  template: Scalars['String']['output'];
  thumb: Scalars['String']['output'];
  title: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  _?: Maybe<Scalars['Boolean']['output']>;
};

export type UserCounts = {
  __typename?: 'UserCounts';
  commentsCount: Scalars['Int']['output'];
  favoritesCount: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type UserPrivate = {
  __typename?: 'UserPrivate';
  description?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  favicon?: Maybe<Scalars['String']['output']>;
  googleAnalytics?: Maybe<Scalars['String']['output']>;
  hostname?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  license?: Maybe<Scalars['String']['output']>;
  logo?: Maybe<Scalars['String']['output']>;
  magicKey: Scalars['String']['output'];
  name: Scalars['String']['output'];
  privateKey: Scalars['String']['output'];
  sidebarHtml?: Maybe<Scalars['String']['output']>;
  superuser: Scalars['Boolean']['output'];
  theme: Scalars['String']['output'];
  title: Scalars['String']['output'];
  username: Scalars['String']['output'];
  viewport?: Maybe<Scalars['String']['output']>;
};

export type UserPublic = {
  __typename?: 'UserPublic';
  description?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  favicon?: Maybe<Scalars['String']['output']>;
  googleAnalytics?: Maybe<Scalars['String']['output']>;
  license?: Maybe<Scalars['String']['output']>;
  logo?: Maybe<Scalars['String']['output']>;
  magicKey: Scalars['String']['output'];
  name: Scalars['String']['output'];
  sidebarHtml?: Maybe<Scalars['String']['output']>;
  theme: Scalars['String']['output'];
  title: Scalars['String']['output'];
  username: Scalars['String']['output'];
  viewport?: Maybe<Scalars['String']['output']>;
};

export type UserRemotePrivate = {
  __typename?: 'UserRemotePrivate';
  activityPubActorUrl?: Maybe<Scalars['String']['output']>;
  activityPubInboxUrl?: Maybe<Scalars['String']['output']>;
  avatar: Scalars['String']['output'];
  favicon?: Maybe<Scalars['String']['output']>;
  feedUrl: Scalars['String']['output'];
  follower: Scalars['Boolean']['output'];
  following: Scalars['Boolean']['output'];
  hubUrl?: Maybe<Scalars['String']['output']>;
  localUsername: Scalars['String']['output'];
  magicKey?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  profileUrl: Scalars['String']['output'];
  salmonUrl?: Maybe<Scalars['String']['output']>;
  sortType?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
  webmentionUrl?: Maybe<Scalars['String']['output']>;
};

export type UserRemotePublic = {
  __typename?: 'UserRemotePublic';
  activityPubActorUrl?: Maybe<Scalars['String']['output']>;
  activityPubInboxUrl?: Maybe<Scalars['String']['output']>;
  avatar: Scalars['String']['output'];
  favicon?: Maybe<Scalars['String']['output']>;
  feedUrl: Scalars['String']['output'];
  follower: Scalars['Boolean']['output'];
  following: Scalars['Boolean']['output'];
  hubUrl?: Maybe<Scalars['String']['output']>;
  localUsername: Scalars['String']['output'];
  magicKey?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  profileUrl: Scalars['String']['output'];
  salmonUrl?: Maybe<Scalars['String']['output']>;
  sortType?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
  webmentionUrl?: Maybe<Scalars['String']['output']>;
};

export type ContentAndUserQueryVariables = Exact<{
  username: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type ContentAndUserQuery = { __typename?: 'Query', fetchContent?: { __typename?: 'Content', album: string, code: string, commentsCount: number, commentsUpdated?: any | null, content: string, count: number, countRobot: number, createdAt: any, forceRefresh?: boolean | null, hidden: boolean, name: string, section: string, style: string, template: string, thread?: string | null, thumb: string, title: string, updatedAt: any, username: string, view: string } | null, fetchCommentsRemote: Array<{ __typename?: 'Comment', avatar?: string | null, creator?: string | null, content?: string | null, deleted: boolean, favorited: boolean, fromUsername?: string | null, link: string, localContentName?: string | null, postId: string, type: string, username: string, view: string }>, fetchFavoritesRemote: Array<{ __typename?: 'Favorite', avatar?: string | null, fromUsername?: string | null, localContentName?: string | null, postId: string, type: string, username: string }>, fetchPublicUserData?: { __typename?: 'UserPublic', username: string, description?: string | null, favicon?: string | null, logo?: string | null, name: string, sidebarHtml?: string | null, title: string, theme: string, viewport?: string | null, license?: string | null, googleAnalytics?: string | null } | null, fetchSiteMap: Array<{ __typename?: 'ContentMetaInfo', album: string, forceRefresh: boolean, hidden: boolean, name: string, section: string, title: string, username: string }>, fetchContentNeighbors?: { __typename?: 'Neighbors', first?: { __typename?: 'ContentMetaInfo', album: string, forceRefresh: boolean, hidden: boolean, name: string, section: string, title: string, username: string } | null, last?: { __typename?: 'ContentMetaInfo', album: string, forceRefresh: boolean, hidden: boolean, name: string, section: string, title: string, username: string } | null, next?: { __typename?: 'ContentMetaInfo', album: string, forceRefresh: boolean, hidden: boolean, name: string, section: string, title: string, username: string, prefetchImages?: Array<string> | null } | null, prev?: { __typename?: 'ContentMetaInfo', album: string, forceRefresh: boolean, hidden: boolean, name: string, section: string, title: string, username: string, prefetchImages?: Array<string> | null } | null, top?: { __typename?: 'ContentMetaInfo', album: string, forceRefresh: boolean, hidden: boolean, name: string, section: string, title: string, username: string, template: string } | null } | null };

export type FetchCollectionQueryVariables = Exact<{
  username: Scalars['String']['input'];
  section: Scalars['String']['input'];
  name: Scalars['String']['input'];
  offset: Scalars['Int']['input'];
}>;


export type FetchCollectionQuery = { __typename?: 'Query', fetchCollectionPaginated: Array<{ __typename?: 'Content', album: string, code: string, commentsCount: number, commentsUpdated?: any | null, count: number, countRobot: number, createdAt: any, updatedAt: any, hidden: boolean, name: string, order: number, redirect: number, section: string, sortType?: string | null, style: string, template: string, thumb: string, title: string, username: string, view: string, content: string }>, fetchPublicUserData?: { __typename?: 'UserPublic', username: string, description?: string | null, favicon?: string | null, logo?: string | null, name: string, title: string, theme: string, viewport?: string | null } | null };

export type SiteMapAndUserQueryVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type SiteMapAndUserQuery = { __typename?: 'Query', fetchSiteMap: Array<{ __typename?: 'ContentMetaInfo', album: string, forceRefresh: boolean, hidden: boolean, name: string, section: string, title: string, username: string }>, fetchPublicUserData?: { __typename?: 'UserPublic', username: string, license?: string | null, logo?: string | null, name: string, title: string, sidebarHtml?: string | null, theme: string, viewport?: string | null } | null };

export type FetchAlbumCollectionQueryVariables = Exact<{
  username: Scalars['String']['input'];
  section: Scalars['String']['input'];
  album: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type FetchAlbumCollectionQuery = { __typename?: 'Query', fetchCollection: Array<{ __typename?: 'ContentMetaInfo', album: string, externalLink?: string | null, forceRefresh: boolean, hidden: boolean, name: string, section: string, thumb: string, title: string, username: string, prefetchImages?: Array<string> | null }> };

export type FetchArchiveCollectionQueryVariables = Exact<{
  username: Scalars['String']['input'];
  section: Scalars['String']['input'];
  album: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type FetchArchiveCollectionQuery = { __typename?: 'Query', fetchCollection: Array<{ __typename?: 'ContentMetaInfo', album: string, forceRefresh: boolean, hidden: boolean, name: string, section: string, title: string, username: string }> };

export type FetchCollectionLatestQueryVariables = Exact<{
  username: Scalars['String']['input'];
  section: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type FetchCollectionLatestQuery = { __typename?: 'Query', fetchCollectionLatest?: { __typename?: 'Content', album: string, name: string, section: string, title: string, username: string, view: string, content: string } | null };

export type SiteMapAndUserEditorQueryVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type SiteMapAndUserEditorQuery = { __typename?: 'Query', fetchSiteMap: Array<{ __typename?: 'ContentMetaInfo', album: string, hidden: boolean, name: string, section: string, title: string, username: string }>, fetchFollowing: Array<{ __typename?: 'UserRemotePublic', name: string, username: string, profileUrl: string, avatar: string, favicon?: string | null }> };

export type PostContentMutationVariables = Exact<{
  section: Scalars['String']['input'];
  album: Scalars['String']['input'];
  name: Scalars['String']['input'];
  title: Scalars['String']['input'];
  hidden: Scalars['Boolean']['input'];
  thumb: Scalars['String']['input'];
  style: Scalars['String']['input'];
  code: Scalars['String']['input'];
  content: Scalars['String']['input'];
}>;


export type PostContentMutation = { __typename?: 'Mutation', postContent: { __typename?: 'Content', username: string, section: string, album: string, name: string, title: string, hidden: boolean, thumb: string, style: string, code: string, content: string } };

export type FetchContentRemotePaginatedQueryVariables = Exact<{
  profileUrlOrSpecialFeed: Scalars['String']['input'];
  offset: Scalars['Int']['input'];
  query?: InputMaybe<Scalars['String']['input']>;
  shouldShowAllItems?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type FetchContentRemotePaginatedQuery = { __typename?: 'Query', fetchContentRemotePaginated: Array<{ __typename?: 'Post', avatar?: string | null, commentsCount: number, creator?: string | null, createdAt: any, deleted: boolean, favorited: boolean, fromUsername?: string | null, isSpam: boolean, link: string, localContentName?: string | null, postId: string, read: boolean, title: string, type: string, updatedAt?: any | null, username: string, view: string }> };

export type FetchFollowersQueryVariables = Exact<{ [key: string]: never; }>;


export type FetchFollowersQuery = { __typename?: 'Query', fetchFollowers: Array<{ __typename?: 'UserRemotePublic', avatar: string, favicon?: string | null, following: boolean, name: string, profileUrl: string, username: string }> };

export type FetchFeedCountsQueryVariables = Exact<{ [key: string]: never; }>;


export type FetchFeedCountsQuery = { __typename?: 'Query', fetchFeedCounts: Array<{ __typename?: 'FeedCount', fromUsername: string, count: number }> };

export type FetchFollowingQueryVariables = Exact<{ [key: string]: never; }>;


export type FetchFollowingQuery = { __typename?: 'Query', fetchFollowing: Array<{ __typename?: 'UserRemotePublic', avatar: string, favicon?: string | null, name: string, profileUrl: string, sortType?: string | null, username: string }> };

export type FetchSpecialFeedCountsQueryVariables = Exact<{ [key: string]: never; }>;


export type FetchSpecialFeedCountsQuery = { __typename?: 'Query', fetchUserTotalCounts: { __typename?: 'UserCounts', commentsCount: number, favoritesCount: number, totalCount: number } };

export type ReadContentRemoteMutationVariables = Exact<{
  fromUsername: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  read: Scalars['Boolean']['input'];
}>;


export type ReadContentRemoteMutation = { __typename?: 'Mutation', readContentRemote: { __typename?: 'Post', fromUsername?: string | null, postId: string, read: boolean } };

export type DeleteContentRemoteMutationVariables = Exact<{
  fromUsername: Scalars['String']['input'];
  localContentName: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  type: Scalars['String']['input'];
  deleted: Scalars['Boolean']['input'];
}>;


export type DeleteContentRemoteMutation = { __typename?: 'Mutation', deleteContentRemote: { __typename?: 'Comment', deleted: boolean, fromUsername?: string | null, localContentName?: string | null, postId: string, type: string } | { __typename?: 'Favorite', deleted: boolean, fromUsername?: string | null, localContentName?: string | null, postId: string, type: string } | { __typename?: 'Post', deleted: boolean, fromUsername?: string | null, localContentName?: string | null, postId: string, type: string } };

export type FavoriteContentRemoteMutationVariables = Exact<{
  fromUsername: Scalars['String']['input'];
  postId: Scalars['String']['input'];
  type: Scalars['String']['input'];
  favorited: Scalars['Boolean']['input'];
}>;


export type FavoriteContentRemoteMutation = { __typename?: 'Mutation', favoriteContentRemote: { __typename?: 'Comment', favorited: boolean, fromUsername?: string | null, postId: string, type: string } | { __typename?: 'Favorite', favorited: boolean, fromUsername?: string | null, postId: string, type: string } | { __typename?: 'Post', favorited: boolean, fromUsername?: string | null, postId: string, type: string } };

export type MarkAllContentInFeedAsReadMutationVariables = Exact<{
  fromUsername: Scalars['String']['input'];
}>;


export type MarkAllContentInFeedAsReadMutation = { __typename?: 'Mutation', markAllContentInFeedAsRead: { __typename?: 'FeedCount', fromUsername: string, count: number } };

export type MarkAllFeedsAsReadMutationVariables = Exact<{ [key: string]: never; }>;


export type MarkAllFeedsAsReadMutation = { __typename?: 'Mutation', markAllFeedsAsRead: { __typename?: 'FeedCount', count: number } };

export type CreateUserRemoteMutationVariables = Exact<{
  profileUrl: Scalars['String']['input'];
}>;


export type CreateUserRemoteMutation = { __typename?: 'Mutation', createUserRemote?: { __typename?: 'UserRemotePublic', avatar: string, favicon?: string | null, name: string, profileUrl: string, sortType?: string | null, username: string } | null };

export type ToggleSortFeedMutationVariables = Exact<{
  profileUrl: Scalars['String']['input'];
  currentSortType: Scalars['String']['input'];
}>;


export type ToggleSortFeedMutation = { __typename?: 'Mutation', toggleSortFeed: { __typename?: 'UserRemotePublic', profileUrl: string, sortType?: string | null } };

export type DestroyFeedMutationVariables = Exact<{
  profileUrl: Scalars['String']['input'];
}>;


export type DestroyFeedMutation = { __typename?: 'Mutation', destroyFeed: boolean };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser?: { __typename?: 'UserPrivate', id: number, username: string, name: string, email: string, theme: string, title: string, favicon?: string | null } | null };

export type FetchAllUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type FetchAllUsersQuery = { __typename?: 'Query', fetchAllUsers: Array<{ __typename?: 'UserPrivate', description?: string | null, email: string, favicon?: string | null, googleAnalytics?: string | null, hostname?: string | null, license?: string | null, logo?: string | null, magicKey: string, name: string, privateKey: string, superuser: boolean, theme: string, title: string, username: string, viewport?: string | null }> };

export type SearchAndUserQueryVariables = Exact<{
  username: Scalars['String']['input'];
  query: Scalars['String']['input'];
}>;


export type SearchAndUserQuery = { __typename?: 'Query', searchContent: Array<{ __typename?: 'SearchContentMetaInfo', album: string, forceRefresh: boolean, hidden: boolean, name: string, preview: string, section: string, thumb: string, title: string, username: string }>, fetchPublicUserDataSearch?: { __typename?: 'UserPublic', description?: string | null, title: string, username: string } | null };



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;


/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = {
  ContentRemote: ( Comment ) | ( Favorite ) | ( Post );
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Comment: ResolverTypeWrapper<Comment>;
  Content: ResolverTypeWrapper<Content>;
  ContentMetaInfo: ResolverTypeWrapper<ContentMetaInfo>;
  ContentRemote: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['ContentRemote']>;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Echo: ResolverTypeWrapper<Echo>;
  Favorite: ResolverTypeWrapper<Favorite>;
  FeedCount: ResolverTypeWrapper<FeedCount>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Neighbors: ResolverTypeWrapper<Neighbors>;
  Post: ResolverTypeWrapper<Post>;
  Query: ResolverTypeWrapper<{}>;
  SearchContentMetaInfo: ResolverTypeWrapper<SearchContentMetaInfo>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  UserCounts: ResolverTypeWrapper<UserCounts>;
  UserPrivate: ResolverTypeWrapper<UserPrivate>;
  UserPublic: ResolverTypeWrapper<UserPublic>;
  UserRemotePrivate: ResolverTypeWrapper<UserRemotePrivate>;
  UserRemotePublic: ResolverTypeWrapper<UserRemotePublic>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  Comment: Comment;
  Content: Content;
  ContentMetaInfo: ContentMetaInfo;
  ContentRemote: ResolversInterfaceTypes<ResolversParentTypes>['ContentRemote'];
  Date: Scalars['Date']['output'];
  Echo: Echo;
  Favorite: Favorite;
  FeedCount: FeedCount;
  Int: Scalars['Int']['output'];
  Mutation: {};
  Neighbors: Neighbors;
  Post: Post;
  Query: {};
  SearchContentMetaInfo: SearchContentMetaInfo;
  String: Scalars['String']['output'];
  Subscription: {};
  UserCounts: UserCounts;
  UserPrivate: UserPrivate;
  UserPublic: UserPublic;
  UserRemotePrivate: UserRemotePrivate;
  UserRemotePublic: UserRemotePublic;
};

export type CommentResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Comment'] = ResolversParentTypes['Comment']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  deleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  favorited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  fromUsername?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  link?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  localContentName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  toUsername?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  view?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Content'] = ResolversParentTypes['Content']> = {
  album?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  commentsCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  commentsUpdated?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  countRobot?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  externalLink?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  favorited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  forceRefresh?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  hidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  prefetchImages?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  redirect?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  section?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sortType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  style?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  template?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thread?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  threadUser?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  thumb?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  view?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentMetaInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ContentMetaInfo'] = ResolversParentTypes['ContentMetaInfo']> = {
  album?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  externalLink?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  forceRefresh?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  prefetchImages?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  section?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  template?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thumb?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentRemoteResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ContentRemote'] = ResolversParentTypes['ContentRemote']> = {
  __resolveType: TypeResolveFn<'Comment' | 'Favorite' | 'Post', ParentType, ContextType>;
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  deleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  favorited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  fromUsername?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localContentName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  toUsername?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type EchoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Echo'] = ResolversParentTypes['Echo']> = {
  exampleField?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FavoriteResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Favorite'] = ResolversParentTypes['Favorite']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  deleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  favorited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  fromUsername?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localContentName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  toUsername?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FeedCountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FeedCount'] = ResolversParentTypes['FeedCount']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fromUsername?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  createUser?: Resolver<Maybe<ResolversTypes['UserPrivate']>, ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'email' | 'username'>>;
  createUserRemote?: Resolver<Maybe<ResolversTypes['UserRemotePublic']>, ParentType, ContextType, RequireFields<MutationCreateUserRemoteArgs, 'profileUrl'>>;
  deleteContent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteContentArgs, 'name'>>;
  deleteContentRemote?: Resolver<ResolversTypes['ContentRemote'], ParentType, ContextType, RequireFields<MutationDeleteContentRemoteArgs, 'deleted' | 'fromUsername' | 'localContentName' | 'postId' | 'type'>>;
  destroyFeed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDestroyFeedArgs, 'profileUrl'>>;
  favoriteContentRemote?: Resolver<ResolversTypes['ContentRemote'], ParentType, ContextType, RequireFields<MutationFavoriteContentRemoteArgs, 'favorited' | 'fromUsername' | 'postId' | 'type'>>;
  markAllContentInFeedAsRead?: Resolver<ResolversTypes['FeedCount'], ParentType, ContextType, RequireFields<MutationMarkAllContentInFeedAsReadArgs, 'fromUsername'>>;
  markAllFeedsAsRead?: Resolver<ResolversTypes['FeedCount'], ParentType, ContextType>;
  postComment?: Resolver<ResolversTypes['Comment'], ParentType, ContextType, RequireFields<MutationPostCommentArgs, 'content' | 'name' | 'username'>>;
  postContent?: Resolver<ResolversTypes['Content'], ParentType, ContextType, RequireFields<MutationPostContentArgs, 'album' | 'code' | 'content' | 'hidden' | 'name' | 'section' | 'style' | 'thumb' | 'title'>>;
  readContentRemote?: Resolver<ResolversTypes['Post'], ParentType, ContextType, RequireFields<MutationReadContentRemoteArgs, 'fromUsername' | 'postId' | 'read'>>;
  saveContent?: Resolver<ResolversTypes['Content'], ParentType, ContextType, RequireFields<MutationSaveContentArgs, 'code' | 'content' | 'hidden' | 'name' | 'style' | 'thumb' | 'title'>>;
  toggleSortFeed?: Resolver<ResolversTypes['UserRemotePublic'], ParentType, ContextType, RequireFields<MutationToggleSortFeedArgs, 'currentSortType' | 'profileUrl'>>;
};

export type NeighborsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Neighbors'] = ResolversParentTypes['Neighbors']> = {
  first?: Resolver<Maybe<ResolversTypes['ContentMetaInfo']>, ParentType, ContextType>;
  last?: Resolver<Maybe<ResolversTypes['ContentMetaInfo']>, ParentType, ContextType>;
  next?: Resolver<Maybe<ResolversTypes['ContentMetaInfo']>, ParentType, ContextType>;
  prev?: Resolver<Maybe<ResolversTypes['ContentMetaInfo']>, ParentType, ContextType>;
  top?: Resolver<Maybe<ResolversTypes['ContentMetaInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PostResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  commentUser?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  commentsCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  commentsUpdated?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  deleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  favorited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  fromUsername?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isSpam?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  link?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  localContentName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  read?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  thread?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  toUsername?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  view?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  allContent?: Resolver<Array<ResolversTypes['Content']>, ParentType, ContextType>;
  allContentRemote?: Resolver<Array<ResolversTypes['ContentRemote']>, ParentType, ContextType>;
  allUsersRemote?: Resolver<Array<ResolversTypes['UserRemotePrivate']>, ParentType, ContextType>;
  currentUser?: Resolver<Maybe<ResolversTypes['UserPrivate']>, ParentType, ContextType>;
  echoExample?: Resolver<Maybe<ResolversTypes['Echo']>, ParentType, ContextType, RequireFields<QueryEchoExampleArgs, 'str'>>;
  fetchAllUsers?: Resolver<Array<ResolversTypes['UserPrivate']>, ParentType, ContextType>;
  fetchCollection?: Resolver<Array<ResolversTypes['ContentMetaInfo']>, ParentType, ContextType, RequireFields<QueryFetchCollectionArgs, 'album' | 'name' | 'section' | 'username'>>;
  fetchCollectionLatest?: Resolver<Maybe<ResolversTypes['Content']>, ParentType, ContextType, RequireFields<QueryFetchCollectionLatestArgs, 'name' | 'section' | 'username'>>;
  fetchCollectionPaginated?: Resolver<Array<ResolversTypes['Content']>, ParentType, ContextType, RequireFields<QueryFetchCollectionPaginatedArgs, 'name' | 'offset' | 'section' | 'username'>>;
  fetchCommentsRemote?: Resolver<Array<ResolversTypes['Comment']>, ParentType, ContextType, Partial<QueryFetchCommentsRemoteArgs>>;
  fetchContent?: Resolver<Maybe<ResolversTypes['Content']>, ParentType, ContextType, Partial<QueryFetchContentArgs>>;
  fetchContentNeighbors?: Resolver<Maybe<ResolversTypes['Neighbors']>, ParentType, ContextType, Partial<QueryFetchContentNeighborsArgs>>;
  fetchContentRemote?: Resolver<Maybe<ResolversTypes['ContentRemote']>, ParentType, ContextType, RequireFields<QueryFetchContentRemoteArgs, 'id'>>;
  fetchContentRemotePaginated?: Resolver<Array<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QueryFetchContentRemotePaginatedArgs, 'offset' | 'profileUrlOrSpecialFeed'>>;
  fetchFavoritesRemote?: Resolver<Array<ResolversTypes['Favorite']>, ParentType, ContextType, Partial<QueryFetchFavoritesRemoteArgs>>;
  fetchFeedCounts?: Resolver<Array<ResolversTypes['FeedCount']>, ParentType, ContextType>;
  fetchFollowers?: Resolver<Array<ResolversTypes['UserRemotePublic']>, ParentType, ContextType>;
  fetchFollowing?: Resolver<Array<ResolversTypes['UserRemotePublic']>, ParentType, ContextType>;
  fetchPublicUserData?: Resolver<Maybe<ResolversTypes['UserPublic']>, ParentType, ContextType, Partial<QueryFetchPublicUserDataArgs>>;
  fetchPublicUserDataSearch?: Resolver<Maybe<ResolversTypes['UserPublic']>, ParentType, ContextType, Partial<QueryFetchPublicUserDataSearchArgs>>;
  fetchSiteMap?: Resolver<Array<ResolversTypes['ContentMetaInfo']>, ParentType, ContextType, RequireFields<QueryFetchSiteMapArgs, 'username'>>;
  fetchUser?: Resolver<Maybe<ResolversTypes['UserPrivate']>, ParentType, ContextType, RequireFields<QueryFetchUserArgs, 'id'>>;
  fetchUserRemote?: Resolver<Maybe<ResolversTypes['UserRemotePrivate']>, ParentType, ContextType, RequireFields<QueryFetchUserRemoteArgs, 'id'>>;
  fetchUserTotalCounts?: Resolver<ResolversTypes['UserCounts'], ParentType, ContextType>;
  hello?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  searchContent?: Resolver<Array<ResolversTypes['SearchContentMetaInfo']>, ParentType, ContextType, RequireFields<QuerySearchContentArgs, 'query' | 'username'>>;
};

export type SearchContentMetaInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['SearchContentMetaInfo'] = ResolversParentTypes['SearchContentMetaInfo']> = {
  album?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  forceRefresh?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  preview?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  section?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  template?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thumb?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  _?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "_", ParentType, ContextType>;
};

export type UserCountsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserCounts'] = ResolversParentTypes['UserCounts']> = {
  commentsCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  favoritesCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserPrivateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserPrivate'] = ResolversParentTypes['UserPrivate']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  favicon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  googleAnalytics?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hostname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  license?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  magicKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  privateKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sidebarHtml?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  superuser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  theme?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  viewport?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserPublicResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserPublic'] = ResolversParentTypes['UserPublic']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  favicon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  googleAnalytics?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  license?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  magicKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sidebarHtml?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  theme?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  viewport?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserRemotePrivateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserRemotePrivate'] = ResolversParentTypes['UserRemotePrivate']> = {
  activityPubActorUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activityPubInboxUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  avatar?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  favicon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  feedUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  follower?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  following?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hubUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localUsername?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  magicKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  profileUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  salmonUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sortType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  webmentionUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserRemotePublicResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserRemotePublic'] = ResolversParentTypes['UserRemotePublic']> = {
  activityPubActorUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activityPubInboxUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  avatar?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  favicon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  feedUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  follower?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  following?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hubUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localUsername?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  magicKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  profileUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  salmonUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sortType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  webmentionUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  Comment?: CommentResolvers<ContextType>;
  Content?: ContentResolvers<ContextType>;
  ContentMetaInfo?: ContentMetaInfoResolvers<ContextType>;
  ContentRemote?: ContentRemoteResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Echo?: EchoResolvers<ContextType>;
  Favorite?: FavoriteResolvers<ContextType>;
  FeedCount?: FeedCountResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Neighbors?: NeighborsResolvers<ContextType>;
  Post?: PostResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SearchContentMetaInfo?: SearchContentMetaInfoResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  UserCounts?: UserCountsResolvers<ContextType>;
  UserPrivate?: UserPrivateResolvers<ContextType>;
  UserPublic?: UserPublicResolvers<ContextType>;
  UserRemotePrivate?: UserRemotePrivateResolvers<ContextType>;
  UserRemotePublic?: UserRemotePublicResolvers<ContextType>;
};

