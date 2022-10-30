import { Close as CloseIcon, Menu as MenuIcon } from '@mui/icons-material';
import { Grid, IconButton, styled } from 'components';
import { defineMessages, useIntl } from 'i18n';
import { useContext, useState } from 'react';

import DashboardEditor from 'components/dashboard/DashboardEditor';
import Feed from 'components/dashboard/Feed';
import Followers from 'components/dashboard/Followers';
import Following from 'components/dashboard/Following';
import Head from 'next/head';
import MyFeed from 'components/content/Feed';
import Tools from 'components/dashboard/Tools';
import UserContext from 'app/UserContext';
import { UserRemotePublic } from 'data/graphql-generated';
import authServerSideProps from 'app/authServerSideProps';
import baseTheme from 'styles';
import { transientOptions } from 'util/css';
import { useTheme } from '@mui/material';

const NAV_WIDTH = '235px';
const MOBILE_NAV_WIDTH = '45px';

const Container = styled('div', { label: 'DashboardContainer' })`
  display: flex;
  align-items: flex-start;
`;

const Content = styled('article', { label: 'DashboardContent' })`
  width: calc(100% - ${NAV_WIDTH} - ${(props) => props.theme.spacing(2.5)});
  margin-top: ${(props) => props.theme.spacing(1)};
  margin-right: ${(props) => props.theme.spacing(1)};

  ${(props) => props.theme.breakpoints.down('md')} {
    width: calc(100% - ${MOBILE_NAV_WIDTH} - ${(props) => props.theme.spacing(1.5)});
  }
`;

const Nav = styled('nav', { label: 'DashboardNav', ...transientOptions })<{ $isMenuOpen: boolean }>`
  position: sticky;
  top: ${(props) => props.theme.spacing(1)};
  width: ${NAV_WIDTH};
  height: 100vh;
  margin: ${(props) => props.theme.spacing(1)};
  overflow: scroll;

  // Feed menu/items
  .MuiListItem-root > .MuiButton-root:first-of-type {
    width: 100%;
    justify-content: space-between;

    .feed-name {
      flex: 1;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  ${(props) => props.theme.breakpoints.down('md')} {
    ${(props) => !props.$isMenuOpen && 'display: none;'}
    background: ${(props) => props.theme.palette.background.default};
    position: fixed;
    inset: 0;
    margin: 0;
    width: 100vw;
    height: 100vh;
    text-align: center;
    padding: ${(props) => props.theme.spacing(2)} 16vw;
    z-index: ${baseTheme.zindex.siteMap};
  }
`;

const Hamburger = styled(IconButton)`
  display: none;
  z-index: ${baseTheme.zindex.siteMapHamburger};

  ${(props) => props.theme.breakpoints.down('md')} {
    width: 45px;
    height: 45px;
    line-height: 0;
    display: block;
  }
`;

const messages = defineMessages({
  menu: { defaultMessage: 'Menu' },
});

export default function Dashboard() {
  const [shouldShowAllItems, setShouldShowAllItems] = useState(false);
  const [didFeedLoad, setDidFeedLoad] = useState(false);
  const [query, setQuery] = useState('');
  const [specialFeed, setSpecialFeed] = useState('');
  const [userRemote, setUserRemote] = useState<UserRemotePublic | null>(null);
  const { user } = useContext(UserContext);
  const intl = useIntl();
  const theme = useTheme();
  const menuButtonLabel = intl.formatMessage(messages.menu);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) {
    return null;
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

  const handleMobileClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <Container>
      <Head>
        {user.theme && <link rel="stylesheet" href={user.theme} />}
        <title>Dashboard – {user.title}</title>
        <link rel="icon" href={user.favicon || `/favicon.jpg`} />
        <link rel="shortcut icon" href={user.favicon || `/favicon.jpg`} />
        {/* TODO refactor to allow different fonts */}
        {/* eslint-disable-next-line */}
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=block" rel="stylesheet" />
      </Head>
      <Hamburger
        aria-label={menuButtonLabel}
        onClick={handleMobileClick}
        size="large"
        sx={{ color: theme.palette.text.primary }}
      >
        {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
      </Hamburger>
      <Nav $isMenuOpen={isMenuOpen} onMouseUp={handleCloseMenu}>
        <Tools />
        <Following handleSetFeed={handleSetFeed} specialFeed={specialFeed} userRemote={userRemote} />
        <Followers handleSetFeed={handleSetFeed} />
      </Nav>

      <Content>
        <DashboardEditor username={user.username} />
        <Grid container justifyContent="space-between">
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
        </Grid>
      </Content>
    </Container>
  );
}

export const getServerSideProps = authServerSideProps();
