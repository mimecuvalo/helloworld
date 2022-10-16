import { gql } from '@apollo/client';

export default gql`
  query FetchFeedCounts {
    fetchFeedCounts {
      fromUsername
      count
    }
  }
`;
