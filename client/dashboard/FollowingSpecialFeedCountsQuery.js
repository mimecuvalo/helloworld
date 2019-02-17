import gql from 'graphql-tag';

export default gql`
  {
    fetchUserTotalCounts {
      commentsCount
      favoritesCount
      totalCount
    }
  }
`;
