import DashboardEditor from './Editor';
import { defineMessages, useIntl } from '../../shared/i18n';
import Feed from './Feed';
import Followers from './Followers';
import Following from './Following';
import MyFeed from '../content/Feed';
import React, { useContext, useState, useRef } from 'react';
import styles from './Dashboard.module.css';
import Tools from './Tools';
import Unauthorized from '../error/401';
import useDocumentTitle from '../app/title';
import UserContext from '../app/User_Context';

const messages = defineMessages({
  title: { msg: 'Dashboard' },
});

export default function Dashboard(props) {
  const intl = useIntl();
  const editor = useRef(null);
  const [shouldShowAllItems, setShouldShowAllItems] = useState(false);
  const [didFeedLoad, setDidFeedLoad] = useState(false);
  const [query, setQuery] = useState(null);
  const [specialFeed, setSpecialFeed] = useState('');
  const [userRemote, setUserRemote] = useState(null);
  const user = useContext(UserContext).user;

  const title = intl.formatMessage(messages.title);
  useDocumentTitle(title);

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
    <div id="hw-dashboard" className={styles.container}>
      <nav className={styles.nav}>
        <Tools className={styles.tools} />
        <Following
          className={styles.following}
          handleSetFeed={handleSetFeed}
          specialFeed={specialFeed}
          userRemote={userRemote}
        />
        <Followers className={styles.followers} handleSetFeed={handleSetFeed} />
      </nav>

      <article className={styles.content}>
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
      </article>
    </div>
  );
}
