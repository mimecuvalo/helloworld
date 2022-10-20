import { SearchAndUserQuery, SearchContentMetaInfo, UserPublic } from 'data/graphql-generated';
import { defineMessages, useIntl } from 'i18n';
import { gql, useQuery } from '@apollo/client';

import ContentBase from '../components/content/ContentBase';
import ContentHead from 'components/content/ContentHead';
import ContentLink from 'components/ContentLink';
import ContentThumb from 'components/ContentThumb';
import { styled } from 'components';

const ContentWrapper = styled('div')`
  --search-header-height: 32px;

  & > header {
    display: block;
    position: absolute;
    top: var(--app-margin);
    left: 180px;
    height: var(--search-header-height);
  }
`;

const List = styled('ol')`
  margin-top: calc(var(--app-margin) + var(--search-header-height) + 10px);
  margin-left: 25px;

  & > li {
    padding: 7px 0;
    border-top: 1px solid #ccc;
    clear: both;
  }

  & > li:first-child {
    border-top: 0;
  }
`;

const ListItemInner = styled('div')`
  display: flex;
`;

const ContentThumbWrapper = styled('span')`
  min-height: auto;
  width: auto;
  margin-right: 5px;

  & > img {
    min-height: auto;
    max-height: 48px;
  }
`;

const Preview = styled('div')`
  max-width: 50vw;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const messages = defineMessages({
  search: { defaultMessage: 'search' },
  untitled: { defaultMessage: 'untitled' },
});

const SEARCH_AND_USER_QUERY = gql`
  query SearchAndUser($username: String!, $query: String!) {
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

export default function Search({ username, query }: { username: string; query: string }) {
  const intl = useIntl();
  const { loading, data } = useQuery<SearchAndUserQuery>(SEARCH_AND_USER_QUERY, {
    variables: {
      username,
      query,
    },
  });

  if (loading || !data) {
    return null;
  }

  const results = data.searchContent as SearchContentMetaInfo[];
  const contentOwner = data.fetchPublicUserDataSearch as UserPublic;
  const pageTitle = intl.formatMessage(messages.search);
  const untitled = intl.formatMessage(messages.untitled);

  return (
    <>
      <ContentHead contentOwner={contentOwner} title={pageTitle} username={username} />
      <ContentWrapper>
        <ContentBase contentOwner={contentOwner} title={pageTitle} username={contentOwner?.username || ''}>
          <List id="hw-results">
            {results.map((item) => (
              <li key={item.name}>
                <ListItemInner>
                  {item.thumb ? (
                    <ContentThumbWrapper>
                      {/* @ts-ignore TODO: this is just a hack */}
                      <ContentThumb item={item} />
                    </ContentThumbWrapper>
                  ) : null}
                  <div>
                    <ContentLink item={item}>
                      <Highlight str={item.title || untitled} term={query} />
                    </ContentLink>
                    <Preview>
                      <Highlight str={item.preview} term={query} />
                    </Preview>
                  </div>
                </ListItemInner>
                <div style={{ clear: 'both' }} />
              </li>
            ))}
          </List>
        </ContentBase>
      </ContentWrapper>
    </>
  );
}

function Highlight({ str, term }: { str: string; term: string }) {
  const regex = new RegExp(`(${term})`, 'gi');
  return (
    <>
      {str
        .split(regex)
        .filter((i) => i)
        .map((part, index) => (part.match(regex) ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>))}
    </>
  );
}
