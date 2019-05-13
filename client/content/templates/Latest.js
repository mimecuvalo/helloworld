import Archive from './Archive';
import { contentUrl } from '../../../shared/util/url_factory';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import Simple from './Simple';
import { withRouter } from 'react-router-dom';

@withRouter
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
        content
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
class Latest extends PureComponent {
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
      // XXX(mime): we do setTimeout 0 because in Content.js we replace history with the canonical url
      // so it's a shitty race condition :-/
      setTimeout(() => this.props.history.replace(contentUrl(this.props.data.fetchCollectionLatest)), 0);
    }
  }

  render() {
    if (this.state.archiveMode) {
      return <Archive content={this.props.content} />;
    }

    if (this.props.data.loading) {
      return null;
    }

    return <Simple content={this.props.data.fetchCollectionLatest} />;
  }
}

export default Latest;
