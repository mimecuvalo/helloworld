import ContentBase from './ContentBase';
import ContentLink from '../components/ContentLink';
import ContentThumb from '../components/ContentThumb';
import { defineMessages, injectIntl } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './Search.module.css';
import UserContext from '../app/User_Context';

const messages = defineMessages({
  search: { msg: 'search' },
  untitled: { msg: 'untitled' },
});

@injectIntl
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
                {item.thumb ? <ContentThumb className={styles.thumbLink} item={item} /> : null}
                <div>
                  <ContentLink item={item} className={styles.title}>
                    <Highlight str={item.title || untitled} term={query} />
                  </ContentLink>
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
export default Search;

const Highlight = React.memo(function Highlight({ str, term }) {
  const regex = new RegExp(`(${term})`, 'gi');
  return str
    .split(regex)
    .filter(i => i)
    .map((part, index) => (part.match(regex) ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>));
});
