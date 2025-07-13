'use client';

import { ListItem, styled } from 'components';
import { SearchAndUserQuery, SearchContentMetaInfo, UserPublic } from 'data/graphql-generated';
import { defineMessages, useIntl } from 'i18n';
import { gql, useQuery } from '@apollo/client';
import ContentBase from 'components/content/ContentBase';
import ContentLink from 'components/ContentLink';
import ContentThumb from 'components/ContentThumb';
import { useEffect, useState } from 'react';

const ContentWrapper = styled('div')`
  --search-header-height: ${(props) => props.theme.spacing(4)};

  & > header {
    display: block;
    position: absolute;
    top: ${(props) => props.theme.spacing(1)};
    left: 180px;
    height: var(--search-header-height);
  }
`;

const List = styled('ol')`
  margin-top: calc(${(props) => props.theme.spacing(1)} + var(--search-header-height) + 10px);
  margin-left: ${(props) => props.theme.spacing(3)};

  & > li {
    padding: ${(props) => props.theme.spacing(1)} 0;
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
  margin-right: ${(props) => props.theme.spacing(0.5)};

  & > img {
    min-height: auto;
    max-height: ${(props) => props.theme.spacing(6)};
  }
`;

const Preview = styled('div')`
  color: #666;
  margin-top: ${(props) => props.theme.spacing(0.5)};
  font-size: 0.875rem;
`;

const messages = defineMessages({
  untitled: {
    defaultMessage: 'untitled',
    id: 'search.untitled',
  },
});

const SEARCH_QUERY = gql`
  query SearchAndUser($username: String!, $query: String!) {
    fetchUser(username: $username) {
      username
      name
      favicon
      theme
    }
    search(username: $username, query: $query) {
      name
      title
      preview
      thumb
      section
      album
      count_comments
      count_favorites
      createdAt
      updatedAt
    }
  }
`;

export default function SearchClient({ host, query }: { host: string; query: string; lang: string }) {
  const intl = useIntl();
  const untitled = intl.formatMessage(messages.untitled);
  const [username, setUsername] = useState<string>('');
  const [searchQuery] = useState(query);

  useEffect(() => {
    // Extract username from host or URL
    // This is a simplified version - you might need more complex logic
    const extractedUsername = host.split('.')[0] || 'default';
    setUsername(extractedUsername);
  }, [host]);

  const { loading, data, error } = useQuery<SearchAndUserQuery>(SEARCH_QUERY, {
    variables: {
      username: username,
      query: searchQuery,
    },
    skip: !username || !searchQuery,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || !data.fetchPublicUserDataSearch) return <div>User not found</div>;

  const contentOwner = data.fetchPublicUserDataSearch as UserPublic;
  const results = (data.searchContent as SearchContentMetaInfo[]) || [];
  const pageTitle = `Search results for "${searchQuery}"`;

  return (
    <ContentWrapper>
      <ContentBase host={host} contentOwner={contentOwner} title={pageTitle} username={contentOwner?.username || ''}>
        <List>
          {results.map((item) => (
            <ListItem key={item.name}>
              <ListItemInner>
                {item.thumb ? (
                  <ContentThumbWrapper>
                    {/* @ts-ignore TODO: this is just a hack */}
                    <ContentThumb item={item} />
                  </ContentThumbWrapper>
                ) : null}
                <div>
                  <ContentLink item={item}>
                    <Highlight str={item.title || untitled} term={searchQuery} />
                  </ContentLink>
                  <Preview>
                    <Highlight str={item.preview} term={searchQuery} />
                  </Preview>
                </div>
              </ListItemInner>
              <div style={{ clear: 'both' }} />
            </ListItem>
          ))}
        </List>
      </ContentBase>
    </ContentWrapper>
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
