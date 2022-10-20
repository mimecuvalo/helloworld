import { useContext, useState } from 'react';

import DashboardEditor from 'components/dashboard/Editor';
import Feed from 'components/dashboard/Feed';
import Followers from 'components/dashboard/Followers';
import Following from 'components/dashboard/Following';
import MyFeed from 'components/content/Feed';
import Tools from 'components/dashboard/Tools';
import Unauthorized from 'components/error/401';
import UserContext from 'app/UserContext';
import { UserRemotePublic } from 'data/graphql-generated';
import { styled } from 'components';

const Container = styled('div')`
  display: flex;
  align-items: flex-start;
`;

const Content = styled('article')`
  display: flex;
  flexdirection: row;
  flexflow: wrap;
  alignitems: flex-start;
  width: 82%;
  margin: 6px;
`;

export default function Dashboard() {
  const [shouldShowAllItems, setShouldShowAllItems] = useState(false);
  const [didFeedLoad, setDidFeedLoad] = useState(false);
  const [query, setQuery] = useState('');
  const [specialFeed, setSpecialFeed] = useState('');
  const [userRemote, setUserRemote] = useState<UserRemotePublic | null>(null);
  const { user } = useContext(UserContext);

  if (!user) {
    return <Unauthorized />;
  }

  const handleSetFeed = (
    userRemoteOrSpecialFeed: UserRemotePublic | string,
    opt_query?: string,
    opt_allItems?: boolean
  ) => {
    setDidFeedLoad(true);
    setQuery(opt_query || '');
    setShouldShowAllItems(!!opt_allItems);

    if (typeof userRemoteOrSpecialFeed === 'string') {
      setSpecialFeed(userRemoteOrSpecialFeed);
      setUserRemote(null);
    } else {
      setSpecialFeed('');
      setUserRemote(userRemoteOrSpecialFeed);
    }

    window.scrollTo(0, 0);
  };

  return (
    <Container id="hw-dashboard">
      <nav>
        <Tools />
        <Following handleSetFeed={handleSetFeed} specialFeed={specialFeed} userRemote={userRemote} />
        <Followers handleSetFeed={handleSetFeed} />
      </nav>

      <Content>
        <DashboardEditor username={user.username} />
        {specialFeed === 'me' ? (
          <MyFeed content={{ username: user.username, section: 'main', name: 'home' }} didFeedLoad={didFeedLoad} />
        ) : (
          <Feed
            didFeedLoad={didFeedLoad}
            query={query}
            shouldShowAllItems={shouldShowAllItems}
            specialFeed={specialFeed}
            userRemote={userRemote}
          />
        )}
      </Content>
    </Container>
  );
}
