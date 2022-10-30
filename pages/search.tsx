import { ListItem, styled } from 'components';
import { SearchAndUserQuery, SearchContentMetaInfo, UserPublic } from 'data/graphql-generated';
import { defineMessages, useIntl } from 'i18n';
import { gql, useQuery } from '@apollo/client';

import ContentBase from 'components/content/ContentBase';
import ContentLink from 'components/ContentLink';
import ContentThumb from 'components/ContentThumb';
import { GetServerSideProps } from 'next';

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

export default function Search({ username, query, host }: { username: string; query: string; host: string }) {
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
                      <Highlight str={item.title || untitled} term={query} />
                    </ContentLink>
                    <Preview>
                      <Highlight str={item.preview} term={query} />
                    </Preview>
                  </div>
                </ListItemInner>
                <div style={{ clear: 'both' }} />
              </ListItem>
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

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const host = req.headers['host'];

  return {
    props: { host },
  };
};
