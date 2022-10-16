import { gql } from '@apollo/client';

export default gql`
  query FetchFollowing {
    fetchFollowing {
      avatar
      favicon
      name
      profileUrl
      sortType
      username
    }
  }
`;
