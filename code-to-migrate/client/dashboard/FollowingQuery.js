import gql from 'graphql-tag';

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
