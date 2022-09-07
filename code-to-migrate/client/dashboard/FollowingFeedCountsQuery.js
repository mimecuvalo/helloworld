import gql from 'graphql-tag';

export default gql`
  {
    fetchFeedCounts {
      from_user
      count
    }
  }
`;
