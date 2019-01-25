import Archive from './Archive';
import { contentUrl } from '../../../shared/util/url_factory';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { Component } from 'react';
import Simple from './Simple';
import { withRouter } from 'react-router-dom';

@graphql(
  gql`
    query($username: String!, $section: String!, $name: String!) {
      fetchCollectionLatest(username: $username, section: $section, name: $name) {
        album
        name
        section
        title
        username
        view
      }
    }
  `,
  {
    options: ({ content: { username, section, name } }) => ({
      variables: {
        username,
        section,
        name,
      },
    }),
  }
)
class Latest extends Component {
  constructor() {
    super();

    this.state = {
      archiveMode: false,
    };
  }

  componentDidMount() {
    const url = new URL(window.location.href);
    if (url.searchParams.get('mode') === 'archive') {
      this.setState({ archiveMode: true });
    } else {
      this.props.history.replace(contentUrl(this.props.data.fetchCollectionLatest));
    }
  }

  render() {
    if (this.state.archiveMode) {
      return <Archive content={this.props.content} />;
    }

    return <Simple content={this.props.data.fetchCollectionLatest} />;
  }
}

export default withRouter(Latest);
