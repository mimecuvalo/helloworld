import classNames from 'classnames';
import ContentBase from './ContentBase';
import { contentUrl } from '../../shared/util/url_factory';
import { defineMessages, injectIntl } from '../../shared/i18n';
import DelayLoadedThumb from '../components/Thumb';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { Link } from 'react-router-dom';
import React, { PureComponent } from 'react';
import styles from './Search.module.css';
import UserContext from '../app/User_Context';

const messages = defineMessages({
  search: { msg: 'search' },
  untitled: { msg: 'untitled' },
});

@graphql(
  gql`
    query SearchAndUserQuery($username: String!, $query: String!) {
      searchContent(username: $username, query: $query) {
        album
        forceRefresh
        hidden
        name
        preview
        section
        thumb
        title
        username
      }

      fetchPublicUserData(username: $username) {
        description
        title
        username
      }
    }
  `,
  {
    options: ({
      match: {
        params: { username, query },
      },
    }) => ({
      variables: {
        username,
        query,
      },
    }),
  }
)
class Search extends PureComponent {
  static contextType = UserContext;

  render() {
    if (this.props.data.loading) {
      return null;
    }

    const query = this.props.match.params.query;
    const results = this.props.data.searchContent;
    const contentOwner = this.props.data.fetchPublicUserData;
    const isOwnerViewing = this.context.user?.model?.username === contentOwner.username;
    const pageTitle = this.props.intl.formatMessage(messages.search);
    const untitled = this.props.intl.formatMessage(messages.untitled);

    return (
      <ContentBase
        className={styles.search}
        contentOwner={contentOwner}
        title={pageTitle}
        username={contentOwner.username}
      >
        <ol id="hw-results" className={styles.list}>
          {results.map(item => (
            <li key={item.name}>
              <div className={styles.innerList}>
                {item.thumb ? (
                  <Link
                    to={contentUrl(item)}
                    className={styles.thumbLink}
                    title={item.title || untitled}
                    target={item.forceRefresh ? '_self' : ''}
                  >
                    <DelayLoadedThumb item={item} />
                  </Link>
                ) : null}
                <div>
                  <Link
                    to={contentUrl(item)}
                    title={item.title || untitled}
                    className={classNames(styles.title, {
                      [styles.hidden]: isOwnerViewing && item.hidden,
                    })}
                    target={item.forceRefresh ? '_self' : ''}
                  >
                    <Highlight str={item.title || untitled} term={query} />
                  </Link>
                  <div className={styles.preview}>
                    <Highlight str={item.preview} term={query} />
                  </div>
                </div>
              </div>
              <div className={styles.clear} />
            </li>
          ))}
        </ol>
      </ContentBase>
    );
  }
}

const Highlight = React.memo(function Highlight({ str, term }) {
  const regex = new RegExp(`(${term})`, 'gi');
  return str
    .split(regex)
    .filter(i => i)
    .map((part, index) => (part.match(regex) ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>));
});

export default injectIntl(Search);
