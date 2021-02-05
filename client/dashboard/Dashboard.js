import { createUseStyles } from 'react-jss';
import DashboardEditor from './Editor';
import { defineMessages, useIntl } from 'react-intl-wrapper';
import Feed from './Feed';
import Followers from './Followers';
import Following from './Following';
import MyFeed from '../content/Feed';
import React, { useContext, useState, useRef } from 'react';
import Tools from './Tools';
import Unauthorized from '../error/401';
import useDocumentTitle from '../app/title';
import UserContext from '../app/User_Context';

const boxStyles = {
  width: 'calc(100% - 20px)',
  padding: '5px',
  marginBottom: '10px',
};

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    flexFlow: 'wrap',
    alignItems: 'flex-start',
    width: '82%',
    margin: '6px',
  },
  nav: {
    position: 'sticky',
    top: '0',
    width: '235px',
    height: '100vh',
    padding: 'var(--app-margin)',
    overflow: 'scroll',
  },
  tools: {
    extend: boxStyles,
    border: '1px solid #c0f',
    boxShadow: '1px 1px #c0f, 2px 2px #c0f, 3px 3px #c0f',
  },
  following: {
    extend: boxStyles,
    border: '1px solid #0c0',
    boxShadow: '1px 1px #0c0, 2px 2px #0c0, 3px 3px #0c0',
  },
  followers: {
    extend: boxStyles,
    border: '1px solid #fa0',
    boxShadow: '1px 1px 0 #fa0, 2px 2px 0 #fa0, 3px 3px 0 #fa0',
  },
});

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
  const styles = useStyles();

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
