import { gql } from '@apollo/client';

export default gql`
  {
    fetchUserTotalCounts {
      commentsCount
      favoritesCount
      totalCount
    }
  }
`;
