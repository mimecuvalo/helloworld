import { gql } from '@apollo/client';

export default gql`
  query FetchSpecialFeedCounts {
    fetchUserTotalCounts {
      commentsCount
      favoritesCount
      totalCount
    }
  }
`;
