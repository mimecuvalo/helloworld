import ContentBase from './ContentBase';
import ContentLink from '../components/ContentLink';
import ContentThumb from '../components/ContentThumb';
import { defineMessages, useIntl } from '../../shared/i18n';
import gql from 'graphql-tag';
import React from 'react';
import styles from './Search.module.css';
import { useQuery } from '@apollo/react-hooks';

const messages = defineMessages({
  search: { msg: 'search' },
  untitled: { msg: 'untitled' },
});

const SEARCH_AND_USER_QUERY = gql`
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

    fetchPublicUserDataSearch(username: $username) {
      description
      title
      username
    }
  }
`;

export default function Search({ match }) {
  const {
    params: { username, query },
  } = match;
  const intl = useIntl();
  const { loading, data } = useQuery(SEARCH_AND_USER_QUERY, {
    variables: {
      username,
      query,
    },
  });

  if (loading) {
    return null;
  }

  const results = data.searchContent;
  const contentOwner = data.fetchPublicUserDataSearch;
  const pageTitle = intl.formatMessage(messages.search);
  const untitled = intl.formatMessage(messages.untitled);

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

const Highlight = React.memo(function Highlight({ str, term }) {
  const regex = new RegExp(`(${term})`, 'gi');
  return str
    .split(regex)
    .filter(i => i)
    .map((part, index) => (part.match(regex) ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>));
});
