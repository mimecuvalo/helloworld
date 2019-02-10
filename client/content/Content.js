import { buildUrl, contentUrl } from '../../shared/util/url_factory';
import classNames from 'classnames';
import ContentBase from './ContentBase';
import ContentQuery from './ContentQuery';
import Feed from './Feed';
import { graphql } from 'react-apollo';
import Item from './Item';
import Nav from './Nav';
import NotFound from '../error/404';
import React, { Component } from 'react';
import Simple from './templates/Simple';
import styles from './Content.module.css';
import { withRouter } from 'react-router-dom';

@graphql(ContentQuery, {
  options: ({
    match: {
      params: { username, name },
    },
  }) => ({
    variables: {
      username: username || '',
      name: username ? name || 'home' : '',
    },
  }),
})
class Content extends Component {
  componentDidMount() {
    if (this.props.data.loading || !this.props.data.fetchContent) {
      return;
    }

    const canonicalUrl = contentUrl(this.props.data.fetchContent);
    const absoluteCanonicalUrl = buildUrl({ isAbsolute: true, pathname: canonicalUrl });
    const parsedCanonicalUrl = new URL(absoluteCanonicalUrl);
    const currentWindowUrl = new URL(window.location.href);
    if (currentWindowUrl.pathname !== parsedCanonicalUrl.pathname) {
      this.props.history.replace(canonicalUrl);
    }
  }

  shouldComponentUpdate(nextProps) {
    return !nextProps.data.loading;
  }

  render() {
    if (this.props.data.loading) {
      return null;
    }

    const content = this.props.data.fetchContent;

    if (!content) {
      return <NotFound />;
    }

    if (content.template === 'blank') {
      return (
        <div id="hw-content">
          <Simple content={content} />
        </div>
      );
    }

    const contentOwner = this.props.data.fetchPublicUserData;
    const item = content.template === 'feed' ? <Feed content={content} /> : <Item content={content} />;
    const title = (content.title ? content.title + ' – ' : '') + contentOwner.title;

    return (
      <ContentBase content={content} contentOwner={contentOwner} title={title} username={content.username}>
        <article className={classNames(styles.content, 'hw-invisible-transition')}>
          <Nav content={content} />
          {item}
        </article>
      </ContentBase>
    );
  }
}

export default withRouter(Content);
