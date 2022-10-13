import { gql } from '@apollo/client';

export default gql`
  {
    fetchFollowing {
      avatar
      favicon
      name
      profile_url
      sort_type
      username
    }
  }
`;
