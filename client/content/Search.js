import ContentBase from './ContentBase';
import ContentLink from '../components/ContentLink';
import ContentThumb from '../components/ContentThumb';
import { createUseStyles } from 'react-jss';
import { defineMessages, useIntl } from 'react-intl-wrapper';
import gql from 'graphql-tag';
import React from 'react';
import { useQuery } from '@apollo/react-hooks';

const useStyles = createUseStyles({
  search: {
    '--search-header-height': '32px',
    '& > header': {
      display: 'block',
      position: 'absolute',
      top: 'var(--app-margin)',
      left: '180px',
      height: 'var(--search-header-height)',
    },
  },
  list: {
    marginTop: 'calc(var(--app-margin) + var(--search-header-height) + 10px)',
    marginLeft: '25px',
    '& > li': {
      padding: '7px 0',
      borderTop: '1px solid #ccc',
      clear: 'both',
    },
    '& > li:first-child': {
      borderTop: '0',
    },
  },
  innerList: {
    display: 'flex',
  },
  thumbLink: {
    minHeight: 'auto',
    width: 'auto',
    marginRight: '5px',
    '& > img': {
      minHeight: 'auto',
      maxHeight: '48px',
    },
  },
  preview: {
    maxWidth: '50vw',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  clear: {
    clear: 'both',
  },
});

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
  const styles = useStyles();

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
