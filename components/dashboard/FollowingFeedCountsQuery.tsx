import { gql } from '@apollo/client';

export default gql`
  {
    fetchFeedCounts {
      from_user
      count
    }
  }
`;
