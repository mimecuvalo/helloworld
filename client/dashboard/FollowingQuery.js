import gql from 'graphql-tag';

export default gql`
  query FollowingQuery {
    fetchFollowing {
      avatar
      favicon
      name
      profile_url
      sort_type
      username
    }

    fetchUserTotalCounts {
      commentsCount
      favoritesCount
      totalCount
    }
  }
`;
