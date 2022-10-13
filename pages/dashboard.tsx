import { useContext, useRef, useState } from 'react';

import DashboardEditor from 'components/dashboard/Editor';
import Feed from 'components/dashboard/Feed';
import Followers from 'components/dashboard/Followers';
import Following from 'components/dashboard/Following';
import MyFeed from 'components/content/Feed';
import Tools from 'components/dashboard/Tools';
import Unauthorized from 'components/error/401';
import UserContext from 'app/UserContext';
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
  const editor = useRef(null);
  const [shouldShowAllItems, setShouldShowAllItems] = useState(false);
  const [didFeedLoad, setDidFeedLoad] = useState(false);
  const [query, setQuery] = useState(null);
  const [specialFeed, setSpecialFeed] = useState('');
  const [userRemote, setUserRemote] = useState(null);
  const user = useContext(UserContext).user;

  if (!user) {
    return <Unauthorized />;
  }

  const handleSetFeed = (userRemoteOrSpecialFeed, opt_query, opt_allItems) => {
    setDidFeedLoad(true);
    setQuery(opt_query);
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

  const getEditor = () => {
    return editor.current;
  };

  return (
    <Container id="hw-dashboard">
      <nav>
        <Tools className={styles.tools} />
        <Following
          className={styles.following}
          handleSetFeed={handleSetFeed}
          specialFeed={specialFeed}
          userRemote={userRemote}
        />
        <Followers className={styles.followers} handleSetFeed={handleSetFeed} />
      </nav>

      <Content>
        <DashboardEditor ref={editor} username={user.model.username} />
        {specialFeed === 'me' ? (
          <MyFeed
            content={{ username: user.model.username, section: 'main', name: 'home' }}
            didFeedLoad={didFeedLoad}
          />
        ) : (
          <Feed
            didFeedLoad={didFeedLoad}
            getEditor={getEditor}
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
