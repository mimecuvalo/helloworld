import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';

// This is an Apollo/GraphQL decorator for the Home component which passes the query result to the props.
@graphql(gql`
  query ($username: String!, $name: String!) {
    fetchContent(username: $username, name: $name) {
      username
      section
      album
      name
      template
      sort_type
      redirect
      title
      date_created
      date_updated
      thumb
      order
      count
      count_robot
      comments_count
      comments_updated
      style
      code
      view
    }
  }
`, {
  options: ({ match: { params: { name, username } } }) => ({
    variables: {
      name,
      username,
    }
  })
})
class Content extends PureComponent {
  render() {
    return (
      <div id="hw-container">
        <article id="hw-content" className="hw-invisible-transition">
          <div className="e-content hw-view hw-individual-content"
            dangerouslySetInnerHTML={{ __html: this.props.data.fetchContent.view }} />
          <div dangerouslySetInnerHTML={{ __html: this.props.data.fetchContent.style }} />
          <div dangerouslySetInnerHTML={{ __html: this.props.data.fetchContent.code }} />
        </article>
      </div>
    );
  }
}

export default Content;
