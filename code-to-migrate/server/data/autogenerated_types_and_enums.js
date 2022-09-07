/* @flow */

import { type GraphQLResolveInfo } from 'graphql';
export type $RequireFields<Origin, Keys> = $Diff<Origin, Keys> &
  $ObjMapi<Keys, <Key>(k: Key) => $NonMaybeType<$ElementType<Origin, Key>>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {|
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
  Date: any,
|};

export type Content = {|
  __typename?: 'Content',
  username: $ElementType<Scalars, 'String'>,
  section: $ElementType<Scalars, 'String'>,
  album: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  template?: ?$ElementType<Scalars, 'String'>,
  sort_type?: ?$ElementType<Scalars, 'String'>,
  redirect: $ElementType<Scalars, 'ID'>,
  hidden: $ElementType<Scalars, 'Boolean'>,
  title: $ElementType<Scalars, 'String'>,
  createdAt: $ElementType<Scalars, 'Date'>,
  updatedAt: $ElementType<Scalars, 'Date'>,
  thumb: $ElementType<Scalars, 'String'>,
  order: $ElementType<Scalars, 'Int'>,
  count: $ElementType<Scalars, 'Int'>,
  count_robot: $ElementType<Scalars, 'Int'>,
  comments_count: $ElementType<Scalars, 'Int'>,
  comments_updated?: ?$ElementType<Scalars, 'Date'>,
  favorited: $ElementType<Scalars, 'Boolean'>,
  thread?: ?$ElementType<Scalars, 'String'>,
  thread_user?: ?$ElementType<Scalars, 'String'>,
  avatar?: ?$ElementType<Scalars, 'String'>,
  style: $ElementType<Scalars, 'String'>,
  code: $ElementType<Scalars, 'String'>,
  view: $ElementType<Scalars, 'String'>,
  content: $ElementType<Scalars, 'String'>,
  forceRefresh?: ?$ElementType<Scalars, 'Boolean'>,
|};

export type ContentMetaInfo = {|
  __typename?: 'ContentMetaInfo',
  username: $ElementType<Scalars, 'String'>,
  section: $ElementType<Scalars, 'String'>,
  album: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  title: $ElementType<Scalars, 'String'>,
  thumb: $ElementType<Scalars, 'String'>,
  hidden: $ElementType<Scalars, 'Boolean'>,
  template: $ElementType<Scalars, 'String'>,
  forceRefresh: $ElementType<Scalars, 'Boolean'>,
  prefetchImages?: ?Array<$ElementType<Scalars, 'String'>>,
  externalLink?: ?$ElementType<Scalars, 'String'>,
|};

export type SearchContentMetaInfo = {|
  __typename?: 'SearchContentMetaInfo',
  username: $ElementType<Scalars, 'String'>,
  section: $ElementType<Scalars, 'String'>,
  album: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  title: $ElementType<Scalars, 'String'>,
  thumb: $ElementType<Scalars, 'String'>,
  hidden: $ElementType<Scalars, 'Boolean'>,
  template: $ElementType<Scalars, 'String'>,
  forceRefresh: $ElementType<Scalars, 'Boolean'>,
  preview: $ElementType<Scalars, 'String'>,
|};

export type Neighbors = {|
  __typename?: 'Neighbors',
  first?: ?ContentMetaInfo,
  prev?: ?ContentMetaInfo,
  top?: ?ContentMetaInfo,
  next?: ?ContentMetaInfo,
  last?: ?ContentMetaInfo,
|};

export type Query = {|
  __typename?: 'Query',
  _?: ?$ElementType<Scalars, 'Boolean'>,
  allContent: Array<Content>,
  allContentRemote: Array<ContentRemote>,
  allUsersRemote: Array<UserRemotePrivate>,
  fetchAllUsers: Array<UserPrivate>,
  fetchCollection: Array<ContentMetaInfo>,
  fetchCollectionLatest?: ?Content,
  fetchCollectionPaginated: Array<Content>,
  fetchCommentsRemote: Array<Comment>,
  fetchContent?: ?Content,
  fetchContentHead?: ?Content,
  fetchContentNeighbors: Neighbors,
  fetchContentRemote?: ?ContentRemote,
  fetchContentRemotePaginated: Array<Post>,
  fetchFavoritesRemote: Array<Favorite>,
  fetchFeedCounts: Array<FeedCount>,
  fetchFollowers: Array<UserRemotePublic>,
  fetchFollowing: Array<UserRemotePublic>,
  fetchPublicUserData?: ?UserPublic,
  fetchPublicUserDataHead?: ?UserPublic,
  fetchPublicUserDataSearch?: ?UserPublic,
  fetchSiteMap: Array<ContentMetaInfo>,
  fetchUser?: ?UserPrivate,
  fetchUserRemote?: ?UserRemotePrivate,
  fetchUserTotalCounts: UserCounts,
  hello?: ?$ElementType<Scalars, 'String'>,
  searchContent: Array<SearchContentMetaInfo>,
|};

export type QueryFetchCollectionArgs = {|
  username: $ElementType<Scalars, 'String'>,
  section: $ElementType<Scalars, 'String'>,
  album: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
|};

export type QueryFetchCollectionLatestArgs = {|
  username: $ElementType<Scalars, 'String'>,
  section: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
|};

export type QueryFetchCollectionPaginatedArgs = {|
  username: $ElementType<Scalars, 'String'>,
  section: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  offset: $ElementType<Scalars, 'Int'>,
|};

export type QueryFetchCommentsRemoteArgs = {|
  username?: ?$ElementType<Scalars, 'String'>,
  name?: ?$ElementType<Scalars, 'String'>,
|};

export type QueryFetchContentArgs = {|
  username?: ?$ElementType<Scalars, 'String'>,
  name?: ?$ElementType<Scalars, 'String'>,
|};

export type QueryFetchContentHeadArgs = {|
  username?: ?$ElementType<Scalars, 'String'>,
  name?: ?$ElementType<Scalars, 'String'>,
|};

export type QueryFetchContentNeighborsArgs = {|
  username?: ?$ElementType<Scalars, 'String'>,
  section?: ?$ElementType<Scalars, 'String'>,
  album?: ?$ElementType<Scalars, 'String'>,
  name?: ?$ElementType<Scalars, 'String'>,
|};

export type QueryFetchContentRemoteArgs = {|
  id: $ElementType<Scalars, 'Int'>,
|};

export type QueryFetchContentRemotePaginatedArgs = {|
  profileUrlOrSpecialFeed: $ElementType<Scalars, 'String'>,
  offset: $ElementType<Scalars, 'Int'>,
  query?: ?$ElementType<Scalars, 'String'>,
  shouldShowAllItems?: ?$ElementType<Scalars, 'Boolean'>,
|};

export type QueryFetchFavoritesRemoteArgs = {|
  username?: ?$ElementType<Scalars, 'String'>,
  name?: ?$ElementType<Scalars, 'String'>,
|};

export type QueryFetchPublicUserDataArgs = {|
  username?: ?$ElementType<Scalars, 'String'>,
|};

export type QueryFetchPublicUserDataHeadArgs = {|
  username?: ?$ElementType<Scalars, 'String'>,
|};

export type QueryFetchPublicUserDataSearchArgs = {|
  username?: ?$ElementType<Scalars, 'String'>,
|};

export type QueryFetchSiteMapArgs = {|
  username: $ElementType<Scalars, 'String'>,
|};

export type QueryFetchUserArgs = {|
  id: $ElementType<Scalars, 'Int'>,
|};

export type QueryFetchUserRemoteArgs = {|
  id: $ElementType<Scalars, 'Int'>,
|};

export type QuerySearchContentArgs = {|
  username: $ElementType<Scalars, 'String'>,
  query: $ElementType<Scalars, 'String'>,
|};

export type Mutation = {|
  __typename?: 'Mutation',
  _?: ?$ElementType<Scalars, 'Boolean'>,
  createUser?: ?UserPrivate,
  createUserRemote?: ?UserRemotePublic,
  deleteContent: $ElementType<Scalars, 'Boolean'>,
  deleteContentRemote: ContentRemote,
  destroyFeed: $ElementType<Scalars, 'Boolean'>,
  favoriteContentRemote: ContentRemote,
  markAllContentInFeedAsRead: FeedCount,
  markAllFeedsAsRead: FeedCount,
  postComment: Comment,
  postContent: Content,
  readContentRemote: Post,
  saveContent: Content,
  toggleSortFeed: UserRemotePublic,
|};

export type MutationCreateUserArgs = {|
  username: $ElementType<Scalars, 'String'>,
  email: $ElementType<Scalars, 'String'>,
|};

export type MutationCreateUserRemoteArgs = {|
  profile_url: $ElementType<Scalars, 'String'>,
|};

export type MutationDeleteContentArgs = {|
  name: $ElementType<Scalars, 'String'>,
|};

export type MutationDeleteContentRemoteArgs = {|
  from_user?: ?$ElementType<Scalars, 'String'>,
  post_id: $ElementType<Scalars, 'String'>,
  local_content_name: $ElementType<Scalars, 'String'>,
  type: $ElementType<Scalars, 'String'>,
  deleted: $ElementType<Scalars, 'Boolean'>,
|};

export type MutationDestroyFeedArgs = {|
  profile_url: $ElementType<Scalars, 'String'>,
|};

export type MutationFavoriteContentRemoteArgs = {|
  from_user?: ?$ElementType<Scalars, 'String'>,
  post_id: $ElementType<Scalars, 'String'>,
  type: $ElementType<Scalars, 'String'>,
  favorited: $ElementType<Scalars, 'Boolean'>,
|};

export type MutationMarkAllContentInFeedAsReadArgs = {|
  from_user: $ElementType<Scalars, 'String'>,
|};

export type MutationPostCommentArgs = {|
  username: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  content: $ElementType<Scalars, 'String'>,
|};

export type MutationPostContentArgs = {|
  section: $ElementType<Scalars, 'String'>,
  album: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  title: $ElementType<Scalars, 'String'>,
  hidden: $ElementType<Scalars, 'Boolean'>,
  thumb: $ElementType<Scalars, 'String'>,
  style: $ElementType<Scalars, 'String'>,
  code: $ElementType<Scalars, 'String'>,
  content: $ElementType<Scalars, 'String'>,
|};

export type MutationReadContentRemoteArgs = {|
  from_user: $ElementType<Scalars, 'String'>,
  post_id: $ElementType<Scalars, 'String'>,
  read: $ElementType<Scalars, 'Boolean'>,
|};

export type MutationSaveContentArgs = {|
  name: $ElementType<Scalars, 'String'>,
  hidden: $ElementType<Scalars, 'Boolean'>,
  title: $ElementType<Scalars, 'String'>,
  thumb: $ElementType<Scalars, 'String'>,
  style: $ElementType<Scalars, 'String'>,
  code: $ElementType<Scalars, 'String'>,
  content: $ElementType<Scalars, 'String'>,
|};

export type MutationToggleSortFeedArgs = {|
  profile_url: $ElementType<Scalars, 'String'>,
  current_sort_type: $ElementType<Scalars, 'String'>,
|};

export type ContentRemote = {|
  avatar?: ?$ElementType<Scalars, 'String'>,
  createdAt: $ElementType<Scalars, 'Date'>,
  deleted: $ElementType<Scalars, 'Boolean'>,
  favorited: $ElementType<Scalars, 'Boolean'>,
  from_user?: ?$ElementType<Scalars, 'String'>,
  local_content_name?: ?$ElementType<Scalars, 'String'>,
  post_id: $ElementType<Scalars, 'String'>,
  to_username: $ElementType<Scalars, 'String'>,
  type: $ElementType<Scalars, 'String'>,
  username: $ElementType<Scalars, 'String'>,
|};

export type Post = {|
  ...ContentRemote,
  ...{|
    __typename?: 'Post',
    avatar?: ?$ElementType<Scalars, 'String'>,
    comment_user?: ?$ElementType<Scalars, 'String'>,
    comments_count: $ElementType<Scalars, 'Int'>,
    comments_updated?: ?$ElementType<Scalars, 'Date'>,
    createdAt: $ElementType<Scalars, 'Date'>,
    creator?: ?$ElementType<Scalars, 'String'>,
    deleted: $ElementType<Scalars, 'Boolean'>,
    favorited: $ElementType<Scalars, 'Boolean'>,
    from_user?: ?$ElementType<Scalars, 'String'>,
    is_spam: $ElementType<Scalars, 'Boolean'>,
    link: $ElementType<Scalars, 'String'>,
    local_content_name?: ?$ElementType<Scalars, 'String'>,
    post_id: $ElementType<Scalars, 'String'>,
    read: $ElementType<Scalars, 'Boolean'>,
    thread?: ?$ElementType<Scalars, 'String'>,
    title: $ElementType<Scalars, 'String'>,
    to_username: $ElementType<Scalars, 'String'>,
    type: $ElementType<Scalars, 'String'>,
    updatedAt?: ?$ElementType<Scalars, 'Date'>,
    username: $ElementType<Scalars, 'String'>,
    view: $ElementType<Scalars, 'String'>,
  |},
|};

export type Comment = {|
  ...ContentRemote,
  ...{|
    __typename?: 'Comment',
    avatar?: ?$ElementType<Scalars, 'String'>,
    creator?: ?$ElementType<Scalars, 'String'>,
    content?: ?$ElementType<Scalars, 'String'>,
    createdAt: $ElementType<Scalars, 'Date'>,
    deleted: $ElementType<Scalars, 'Boolean'>,
    favorited: $ElementType<Scalars, 'Boolean'>,
    from_user?: ?$ElementType<Scalars, 'String'>,
    link: $ElementType<Scalars, 'String'>,
    local_content_name?: ?$ElementType<Scalars, 'String'>,
    post_id: $ElementType<Scalars, 'String'>,
    to_username: $ElementType<Scalars, 'String'>,
    type: $ElementType<Scalars, 'String'>,
    username: $ElementType<Scalars, 'String'>,
    view?: ?$ElementType<Scalars, 'String'>,
  |},
|};

export type Favorite = {|
  ...ContentRemote,
  ...{|
    __typename?: 'Favorite',
    avatar?: ?$ElementType<Scalars, 'String'>,
    createdAt: $ElementType<Scalars, 'Date'>,
    deleted: $ElementType<Scalars, 'Boolean'>,
    favorited: $ElementType<Scalars, 'Boolean'>,
    from_user?: ?$ElementType<Scalars, 'String'>,
    local_content_name?: ?$ElementType<Scalars, 'String'>,
    post_id: $ElementType<Scalars, 'String'>,
    to_username: $ElementType<Scalars, 'String'>,
    type: $ElementType<Scalars, 'String'>,
    username: $ElementType<Scalars, 'String'>,
  |},
|};

export type UserCounts = {|
  __typename?: 'UserCounts',
  commentsCount: $ElementType<Scalars, 'Int'>,
  favoritesCount: $ElementType<Scalars, 'Int'>,
  totalCount: $ElementType<Scalars, 'Int'>,
|};

export type FeedCount = {|
  __typename?: 'FeedCount',
  from_user: $ElementType<Scalars, 'String'>,
  count: $ElementType<Scalars, 'Int'>,
|};

export type Subscription = {|
  __typename?: 'Subscription',
  _?: ?$ElementType<Scalars, 'Boolean'>,
|};

export type UserPrivate = {|
  __typename?: 'UserPrivate',
  username: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  email: $ElementType<Scalars, 'String'>,
  title: $ElementType<Scalars, 'String'>,
  description?: ?$ElementType<Scalars, 'String'>,
  license?: ?$ElementType<Scalars, 'String'>,
  google_analytics?: ?$ElementType<Scalars, 'String'>,
  magic_key: $ElementType<Scalars, 'String'>,
  favicon?: ?$ElementType<Scalars, 'String'>,
  logo?: ?$ElementType<Scalars, 'String'>,
  theme: $ElementType<Scalars, 'String'>,
  viewport?: ?$ElementType<Scalars, 'String'>,
  sidebar_html?: ?$ElementType<Scalars, 'String'>,
  superuser: $ElementType<Scalars, 'Boolean'>,
  hostname?: ?$ElementType<Scalars, 'String'>,
  private_key: $ElementType<Scalars, 'String'>,
|};

export type UserPublic = {|
  __typename?: 'UserPublic',
  username: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  email: $ElementType<Scalars, 'String'>,
  title: $ElementType<Scalars, 'String'>,
  description?: ?$ElementType<Scalars, 'String'>,
  license?: ?$ElementType<Scalars, 'String'>,
  google_analytics?: ?$ElementType<Scalars, 'String'>,
  magic_key: $ElementType<Scalars, 'String'>,
  favicon?: ?$ElementType<Scalars, 'String'>,
  logo?: ?$ElementType<Scalars, 'String'>,
  theme: $ElementType<Scalars, 'String'>,
  viewport?: ?$ElementType<Scalars, 'String'>,
  sidebar_html?: ?$ElementType<Scalars, 'String'>,
|};

export type UserRemotePrivate = {|
  __typename?: 'UserRemotePrivate',
  local_username: $ElementType<Scalars, 'String'>,
  username: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  profile_url: $ElementType<Scalars, 'String'>,
  salmon_url?: ?$ElementType<Scalars, 'String'>,
  activitypub_actor_url?: ?$ElementType<Scalars, 'String'>,
  activitypub_inbox_url?: ?$ElementType<Scalars, 'String'>,
  webmention_url?: ?$ElementType<Scalars, 'String'>,
  magic_key?: ?$ElementType<Scalars, 'String'>,
  follower: $ElementType<Scalars, 'Boolean'>,
  following: $ElementType<Scalars, 'Boolean'>,
  feed_url: $ElementType<Scalars, 'String'>,
  hub_url?: ?$ElementType<Scalars, 'String'>,
  avatar: $ElementType<Scalars, 'String'>,
  favicon?: ?$ElementType<Scalars, 'String'>,
  sort_type?: ?$ElementType<Scalars, 'String'>,
  order: $ElementType<Scalars, 'Int'>,
|};

export type UserRemotePublic = {|
  __typename?: 'UserRemotePublic',
  local_username: $ElementType<Scalars, 'String'>,
  username: $ElementType<Scalars, 'String'>,
  name: $ElementType<Scalars, 'String'>,
  profile_url: $ElementType<Scalars, 'String'>,
  salmon_url?: ?$ElementType<Scalars, 'String'>,
  activitypub_actor_url?: ?$ElementType<Scalars, 'String'>,
  activitypub_inbox_url?: ?$ElementType<Scalars, 'String'>,
  webmention_url?: ?$ElementType<Scalars, 'String'>,
  magic_key?: ?$ElementType<Scalars, 'String'>,
  follower: $ElementType<Scalars, 'Boolean'>,
  following: $ElementType<Scalars, 'Boolean'>,
  feed_url: $ElementType<Scalars, 'String'>,
  hub_url?: ?$ElementType<Scalars, 'String'>,
  avatar: $ElementType<Scalars, 'String'>,
  favicon?: ?$ElementType<Scalars, 'String'>,
  sort_type?: ?$ElementType<Scalars, 'String'>,
|};

export type Resolver<Result, Parent = {}, Context = {}, Args = {}> = (
  parent: Parent,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo
) => Promise<Result> | Result;

export type SubscriptionSubscribeFn<Result, Parent, Context, Args> = (
  parent: Parent,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo
) => AsyncIterator<Result> | Promise<AsyncIterator<Result>>;

export type SubscriptionResolveFn<Result, Parent, Context, Args> = (
  parent: Parent,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo
) => Result | Promise<Result>;

export interface SubscriptionSubscriberObject<Result, Key: string, Parent, Context, Args> {
  subscribe: SubscriptionSubscribeFn<{ [key: Key]: Result }, Parent, Context, Args>;
  resolve?: SubscriptionResolveFn<Result, { [key: Key]: Result }, Context, Args>;
}

export interface SubscriptionResolverObject<Result, Parent, Context, Args> {
  subscribe: SubscriptionSubscribeFn<mixed, Parent, Context, Args>;
  resolve: SubscriptionResolveFn<Result, mixed, Context, Args>;
}

export type SubscriptionObject<Result, Key: string, Parent, Context, Args> =
  | SubscriptionSubscriberObject<Result, Key, Parent, Context, Args>
  | SubscriptionResolverObject<Result, Parent, Context, Args>;

export type SubscriptionResolver<Result, Key: string, Parent = {}, Context = {}, Args = {}> =
  | ((...args: Array<any>) => SubscriptionObject<Result, Key, Parent, Context, Args>)
  | SubscriptionObject<Result, Key, Parent, Context, Args>;

export type TypeResolveFn<Types, Parent = {}, Context = {}> = (
  parent: Parent,
  context: Context,
  info: GraphQLResolveInfo
) => ?Types | Promise<?Types>;

export type isTypeOfResolverFn<T = {}> = (obj: T, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<Result = {}, Parent = {}, Args = {}, Context = {}> = (
  next: NextResolverFn<Result>,
  parent: Parent,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo
) => Result | Promise<Result>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Content: ResolverTypeWrapper<Content>,
  String: ResolverTypeWrapper<$ElementType<Scalars, 'String'>>,
  ID: ResolverTypeWrapper<$ElementType<Scalars, 'ID'>>,
  Boolean: ResolverTypeWrapper<$ElementType<Scalars, 'Boolean'>>,
  Int: ResolverTypeWrapper<$ElementType<Scalars, 'Int'>>,
  ContentMetaInfo: ResolverTypeWrapper<ContentMetaInfo>,
  SearchContentMetaInfo: ResolverTypeWrapper<SearchContentMetaInfo>,
  Neighbors: ResolverTypeWrapper<Neighbors>,
  Query: ResolverTypeWrapper<{}>,
  Mutation: ResolverTypeWrapper<{}>,
  ContentRemote:
    | $ElementType<ResolversTypes, 'Post'>
    | $ElementType<ResolversTypes, 'Comment'>
    | $ElementType<ResolversTypes, 'Favorite'>,
  Post: ResolverTypeWrapper<Post>,
  Comment: ResolverTypeWrapper<Comment>,
  Favorite: ResolverTypeWrapper<Favorite>,
  UserCounts: ResolverTypeWrapper<UserCounts>,
  FeedCount: ResolverTypeWrapper<FeedCount>,
  Subscription: ResolverTypeWrapper<{}>,
  Date: ResolverTypeWrapper<$ElementType<Scalars, 'Date'>>,
  UserPrivate: ResolverTypeWrapper<UserPrivate>,
  UserPublic: ResolverTypeWrapper<UserPublic>,
  UserRemotePrivate: ResolverTypeWrapper<UserRemotePrivate>,
  UserRemotePublic: ResolverTypeWrapper<UserRemotePublic>,
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Content: Content,
  String: $ElementType<Scalars, 'String'>,
  ID: $ElementType<Scalars, 'ID'>,
  Boolean: $ElementType<Scalars, 'Boolean'>,
  Int: $ElementType<Scalars, 'Int'>,
  ContentMetaInfo: ContentMetaInfo,
  SearchContentMetaInfo: SearchContentMetaInfo,
  Neighbors: Neighbors,
  Query: {},
  Mutation: {},
  ContentRemote:
    | $ElementType<ResolversParentTypes, 'Post'>
    | $ElementType<ResolversParentTypes, 'Comment'>
    | $ElementType<ResolversParentTypes, 'Favorite'>,
  Post: Post,
  Comment: Comment,
  Favorite: Favorite,
  UserCounts: UserCounts,
  FeedCount: FeedCount,
  Subscription: {},
  Date: $ElementType<Scalars, 'Date'>,
  UserPrivate: UserPrivate,
  UserPublic: UserPublic,
  UserRemotePrivate: UserRemotePrivate,
  UserRemotePublic: UserRemotePublic,
};

export type ContentResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'Content'>> = {
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  section?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  album?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  name?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  template?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  sort_type?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  redirect?: Resolver<$ElementType<ResolversTypes, 'ID'>, ParentType, ContextType>,
  hidden?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  title?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  createdAt?: Resolver<$ElementType<ResolversTypes, 'Date'>, ParentType, ContextType>,
  updatedAt?: Resolver<$ElementType<ResolversTypes, 'Date'>, ParentType, ContextType>,
  thumb?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  order?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  count?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  count_robot?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  comments_count?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  comments_updated?: Resolver<?$ElementType<ResolversTypes, 'Date'>, ParentType, ContextType>,
  favorited?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  thread?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  thread_user?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  avatar?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  style?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  code?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  view?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  content?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  forceRefresh?: Resolver<?$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type ContentMetaInfoResolvers<
  ContextType = any,
  ParentType = $ElementType<ResolversParentTypes, 'ContentMetaInfo'>
> = {
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  section?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  album?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  name?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  title?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  thumb?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  hidden?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  template?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  forceRefresh?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  prefetchImages?: Resolver<?Array<$ElementType<ResolversTypes, 'String'>>, ParentType, ContextType>,
  externalLink?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type SearchContentMetaInfoResolvers<
  ContextType = any,
  ParentType = $ElementType<ResolversParentTypes, 'SearchContentMetaInfo'>
> = {
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  section?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  album?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  name?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  title?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  thumb?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  hidden?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  template?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  forceRefresh?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  preview?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type NeighborsResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'Neighbors'>> = {
  first?: Resolver<?$ElementType<ResolversTypes, 'ContentMetaInfo'>, ParentType, ContextType>,
  prev?: Resolver<?$ElementType<ResolversTypes, 'ContentMetaInfo'>, ParentType, ContextType>,
  top?: Resolver<?$ElementType<ResolversTypes, 'ContentMetaInfo'>, ParentType, ContextType>,
  next?: Resolver<?$ElementType<ResolversTypes, 'ContentMetaInfo'>, ParentType, ContextType>,
  last?: Resolver<?$ElementType<ResolversTypes, 'ContentMetaInfo'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type QueryResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'Query'>> = {
  _?: Resolver<?$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  allContent?: Resolver<Array<$ElementType<ResolversTypes, 'Content'>>, ParentType, ContextType>,
  allContentRemote?: Resolver<Array<$ElementType<ResolversTypes, 'ContentRemote'>>, ParentType, ContextType>,
  allUsersRemote?: Resolver<Array<$ElementType<ResolversTypes, 'UserRemotePrivate'>>, ParentType, ContextType>,
  fetchAllUsers?: Resolver<Array<$ElementType<ResolversTypes, 'UserPrivate'>>, ParentType, ContextType>,
  fetchCollection?: Resolver<
    Array<$ElementType<ResolversTypes, 'ContentMetaInfo'>>,
    ParentType,
    ContextType,
    $RequireFields<QueryFetchCollectionArgs, { username: *, section: *, album: *, name: * }>
  >,
  fetchCollectionLatest?: Resolver<
    ?$ElementType<ResolversTypes, 'Content'>,
    ParentType,
    ContextType,
    $RequireFields<QueryFetchCollectionLatestArgs, { username: *, section: *, name: * }>
  >,
  fetchCollectionPaginated?: Resolver<
    Array<$ElementType<ResolversTypes, 'Content'>>,
    ParentType,
    ContextType,
    $RequireFields<QueryFetchCollectionPaginatedArgs, { username: *, section: *, name: *, offset: * }>
  >,
  fetchCommentsRemote?: Resolver<
    Array<$ElementType<ResolversTypes, 'Comment'>>,
    ParentType,
    ContextType,
    QueryFetchCommentsRemoteArgs
  >,
  fetchContent?: Resolver<?$ElementType<ResolversTypes, 'Content'>, ParentType, ContextType, QueryFetchContentArgs>,
  fetchContentHead?: Resolver<
    ?$ElementType<ResolversTypes, 'Content'>,
    ParentType,
    ContextType,
    QueryFetchContentHeadArgs
  >,
  fetchContentNeighbors?: Resolver<
    $ElementType<ResolversTypes, 'Neighbors'>,
    ParentType,
    ContextType,
    QueryFetchContentNeighborsArgs
  >,
  fetchContentRemote?: Resolver<
    ?$ElementType<ResolversTypes, 'ContentRemote'>,
    ParentType,
    ContextType,
    $RequireFields<QueryFetchContentRemoteArgs, { id: * }>
  >,
  fetchContentRemotePaginated?: Resolver<
    Array<$ElementType<ResolversTypes, 'Post'>>,
    ParentType,
    ContextType,
    $RequireFields<QueryFetchContentRemotePaginatedArgs, { profileUrlOrSpecialFeed: *, offset: * }>
  >,
  fetchFavoritesRemote?: Resolver<
    Array<$ElementType<ResolversTypes, 'Favorite'>>,
    ParentType,
    ContextType,
    QueryFetchFavoritesRemoteArgs
  >,
  fetchFeedCounts?: Resolver<Array<$ElementType<ResolversTypes, 'FeedCount'>>, ParentType, ContextType>,
  fetchFollowers?: Resolver<Array<$ElementType<ResolversTypes, 'UserRemotePublic'>>, ParentType, ContextType>,
  fetchFollowing?: Resolver<Array<$ElementType<ResolversTypes, 'UserRemotePublic'>>, ParentType, ContextType>,
  fetchPublicUserData?: Resolver<
    ?$ElementType<ResolversTypes, 'UserPublic'>,
    ParentType,
    ContextType,
    QueryFetchPublicUserDataArgs
  >,
  fetchPublicUserDataHead?: Resolver<
    ?$ElementType<ResolversTypes, 'UserPublic'>,
    ParentType,
    ContextType,
    QueryFetchPublicUserDataHeadArgs
  >,
  fetchPublicUserDataSearch?: Resolver<
    ?$ElementType<ResolversTypes, 'UserPublic'>,
    ParentType,
    ContextType,
    QueryFetchPublicUserDataSearchArgs
  >,
  fetchSiteMap?: Resolver<
    Array<$ElementType<ResolversTypes, 'ContentMetaInfo'>>,
    ParentType,
    ContextType,
    $RequireFields<QueryFetchSiteMapArgs, { username: * }>
  >,
  fetchUser?: Resolver<
    ?$ElementType<ResolversTypes, 'UserPrivate'>,
    ParentType,
    ContextType,
    $RequireFields<QueryFetchUserArgs, { id: * }>
  >,
  fetchUserRemote?: Resolver<
    ?$ElementType<ResolversTypes, 'UserRemotePrivate'>,
    ParentType,
    ContextType,
    $RequireFields<QueryFetchUserRemoteArgs, { id: * }>
  >,
  fetchUserTotalCounts?: Resolver<$ElementType<ResolversTypes, 'UserCounts'>, ParentType, ContextType>,
  hello?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  searchContent?: Resolver<
    Array<$ElementType<ResolversTypes, 'SearchContentMetaInfo'>>,
    ParentType,
    ContextType,
    $RequireFields<QuerySearchContentArgs, { username: *, query: * }>
  >,
};

export type MutationResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'Mutation'>> = {
  _?: Resolver<?$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  createUser?: Resolver<
    ?$ElementType<ResolversTypes, 'UserPrivate'>,
    ParentType,
    ContextType,
    $RequireFields<MutationCreateUserArgs, { username: *, email: * }>
  >,
  createUserRemote?: Resolver<
    ?$ElementType<ResolversTypes, 'UserRemotePublic'>,
    ParentType,
    ContextType,
    $RequireFields<MutationCreateUserRemoteArgs, { profile_url: * }>
  >,
  deleteContent?: Resolver<
    $ElementType<ResolversTypes, 'Boolean'>,
    ParentType,
    ContextType,
    $RequireFields<MutationDeleteContentArgs, { name: * }>
  >,
  deleteContentRemote?: Resolver<
    $ElementType<ResolversTypes, 'ContentRemote'>,
    ParentType,
    ContextType,
    $RequireFields<MutationDeleteContentRemoteArgs, { post_id: *, local_content_name: *, type: *, deleted: * }>
  >,
  destroyFeed?: Resolver<
    $ElementType<ResolversTypes, 'Boolean'>,
    ParentType,
    ContextType,
    $RequireFields<MutationDestroyFeedArgs, { profile_url: * }>
  >,
  favoriteContentRemote?: Resolver<
    $ElementType<ResolversTypes, 'ContentRemote'>,
    ParentType,
    ContextType,
    $RequireFields<MutationFavoriteContentRemoteArgs, { post_id: *, type: *, favorited: * }>
  >,
  markAllContentInFeedAsRead?: Resolver<
    $ElementType<ResolversTypes, 'FeedCount'>,
    ParentType,
    ContextType,
    $RequireFields<MutationMarkAllContentInFeedAsReadArgs, { from_user: * }>
  >,
  markAllFeedsAsRead?: Resolver<$ElementType<ResolversTypes, 'FeedCount'>, ParentType, ContextType>,
  postComment?: Resolver<
    $ElementType<ResolversTypes, 'Comment'>,
    ParentType,
    ContextType,
    $RequireFields<MutationPostCommentArgs, { username: *, name: *, content: * }>
  >,
  postContent?: Resolver<
    $ElementType<ResolversTypes, 'Content'>,
    ParentType,
    ContextType,
    $RequireFields<
      MutationPostContentArgs,
      { section: *, album: *, name: *, title: *, hidden: *, thumb: *, style: *, code: *, content: * }
    >
  >,
  readContentRemote?: Resolver<
    $ElementType<ResolversTypes, 'Post'>,
    ParentType,
    ContextType,
    $RequireFields<MutationReadContentRemoteArgs, { from_user: *, post_id: *, read: * }>
  >,
  saveContent?: Resolver<
    $ElementType<ResolversTypes, 'Content'>,
    ParentType,
    ContextType,
    $RequireFields<MutationSaveContentArgs, { name: *, hidden: *, title: *, thumb: *, style: *, code: *, content: * }>
  >,
  toggleSortFeed?: Resolver<
    $ElementType<ResolversTypes, 'UserRemotePublic'>,
    ParentType,
    ContextType,
    $RequireFields<MutationToggleSortFeedArgs, { profile_url: *, current_sort_type: * }>
  >,
};

export type ContentRemoteResolvers<
  ContextType = any,
  ParentType = $ElementType<ResolversParentTypes, 'ContentRemote'>
> = {
  __resolveType: TypeResolveFn<'Post' | 'Comment' | 'Favorite', ParentType, ContextType>,
  avatar?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  createdAt?: Resolver<$ElementType<ResolversTypes, 'Date'>, ParentType, ContextType>,
  deleted?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  favorited?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  from_user?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  local_content_name?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  post_id?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  to_username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  type?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
};

export type PostResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'Post'>> = {
  avatar?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  comment_user?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  comments_count?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  comments_updated?: Resolver<?$ElementType<ResolversTypes, 'Date'>, ParentType, ContextType>,
  createdAt?: Resolver<$ElementType<ResolversTypes, 'Date'>, ParentType, ContextType>,
  creator?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  deleted?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  favorited?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  from_user?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  is_spam?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  link?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  local_content_name?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  post_id?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  read?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  thread?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  title?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  to_username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  type?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  updatedAt?: Resolver<?$ElementType<ResolversTypes, 'Date'>, ParentType, ContextType>,
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  view?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type CommentResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'Comment'>> = {
  avatar?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  creator?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  content?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  createdAt?: Resolver<$ElementType<ResolversTypes, 'Date'>, ParentType, ContextType>,
  deleted?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  favorited?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  from_user?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  link?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  local_content_name?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  post_id?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  to_username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  type?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  view?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type FavoriteResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'Favorite'>> = {
  avatar?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  createdAt?: Resolver<$ElementType<ResolversTypes, 'Date'>, ParentType, ContextType>,
  deleted?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  favorited?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  from_user?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  local_content_name?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  post_id?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  to_username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  type?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type UserCountsResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'UserCounts'>> = {
  commentsCount?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  favoritesCount?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  totalCount?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type FeedCountResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'FeedCount'>> = {
  from_user?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  count?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type SubscriptionResolvers<
  ContextType = any,
  ParentType = $ElementType<ResolversParentTypes, 'Subscription'>
> = {
  _?: SubscriptionResolver<?$ElementType<ResolversTypes, 'Boolean'>, '_', ParentType, ContextType>,
};

export type DateScalarConfig = {
  ...GraphQLScalarTypeConfig<$ElementType<ResolversTypes, 'Date'>, any>,
  name: 'Date',
};

export type UserPrivateResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'UserPrivate'>> = {
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  name?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  email?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  title?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  description?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  license?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  google_analytics?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  magic_key?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  favicon?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  logo?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  theme?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  viewport?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  sidebar_html?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  superuser?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  hostname?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  private_key?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type UserPublicResolvers<ContextType = any, ParentType = $ElementType<ResolversParentTypes, 'UserPublic'>> = {
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  name?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  email?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  title?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  description?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  license?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  google_analytics?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  magic_key?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  favicon?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  logo?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  theme?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  viewport?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  sidebar_html?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type UserRemotePrivateResolvers<
  ContextType = any,
  ParentType = $ElementType<ResolversParentTypes, 'UserRemotePrivate'>
> = {
  local_username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  name?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  profile_url?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  salmon_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  activitypub_actor_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  activitypub_inbox_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  webmention_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  magic_key?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  follower?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  following?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  feed_url?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  hub_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  avatar?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  favicon?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  sort_type?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  order?: Resolver<$ElementType<ResolversTypes, 'Int'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type UserRemotePublicResolvers<
  ContextType = any,
  ParentType = $ElementType<ResolversParentTypes, 'UserRemotePublic'>
> = {
  local_username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  username?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  name?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  profile_url?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  salmon_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  activitypub_actor_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  activitypub_inbox_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  webmention_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  magic_key?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  follower?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  following?: Resolver<$ElementType<ResolversTypes, 'Boolean'>, ParentType, ContextType>,
  feed_url?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  hub_url?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  avatar?: Resolver<$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  favicon?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  sort_type?: Resolver<?$ElementType<ResolversTypes, 'String'>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type Resolvers<ContextType = any> = {
  Content?: ContentResolvers<ContextType>,
  ContentMetaInfo?: ContentMetaInfoResolvers<ContextType>,
  SearchContentMetaInfo?: SearchContentMetaInfoResolvers<ContextType>,
  Neighbors?: NeighborsResolvers<ContextType>,
  Query?: QueryResolvers<ContextType>,
  Mutation?: MutationResolvers<ContextType>,
  ContentRemote?: ContentRemoteResolvers<>,
  Post?: PostResolvers<ContextType>,
  Comment?: CommentResolvers<ContextType>,
  Favorite?: FavoriteResolvers<ContextType>,
  UserCounts?: UserCountsResolvers<ContextType>,
  FeedCount?: FeedCountResolvers<ContextType>,
  Subscription?: SubscriptionResolvers<ContextType>,
  Date?: GraphQLScalarType<>,
  UserPrivate?: UserPrivateResolvers<ContextType>,
  UserPublic?: UserPublicResolvers<ContextType>,
  UserRemotePrivate?: UserRemotePrivateResolvers<ContextType>,
  UserRemotePublic?: UserRemotePublicResolvers<ContextType>,
};

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
