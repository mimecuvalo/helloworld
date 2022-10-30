import { Avatar, Box, IconButton, Link, TextField, styled } from 'components';
import { Content, SiteMapAndUserQuery } from 'data/graphql-generated';
import { F, defineMessages, useIntl } from 'i18n';
import { FormEvent, ReactNode, useContext, useEffect, useState } from 'react';
import { buildUrl, profileUrl } from 'util/url-factory';
import { gql, useQuery } from '@apollo/client';

import CloseIcon from '@mui/icons-material/Close';
import ContentLink from 'components/ContentLink';
import Image from 'next/image';
import LoginLogoutButton from 'components/Login';
import MenuIcon from '@mui/icons-material/Menu';
import UserContext from 'app/UserContext';
import baseTheme from 'styles';
import constants from 'util/constants';
import { transientOptions } from 'util/css';
import { useRouter } from 'next/router';
import { useTheme } from '@mui/material';

export const SITE_MAP_WIDTH = 175;

const Nav = styled('nav', transientOptions)<{ $isMenuOpen: boolean }>`
  height: calc(100vh - ${(props) => props.theme.spacing(1)} * 2);
  width: ${SITE_MAP_WIDTH}px;
  overflow: auto;
  background: ${(props) => props.theme.palette.background.default};
  margin: ${(props) => props.theme.spacing(1)};
  margin-right: ${(props) => props.theme.spacing(3.5)};
  padding: ${(props) => props.theme.spacing(0.5)};

  border: 1px solid ${(props) => props.theme.palette.primary.light};
  box-shadow: 1px 1px ${(props) => props.theme.palette.primary.light},
    2px 2px ${(props) => props.theme.palette.primary.light}, 3px 3px ${(props) => props.theme.palette.primary.light};

  ${(props) => props.theme.breakpoints.down('md')} {
    ${(props) => !props.$isMenuOpen && 'display: none;'}
    background: ${(props) => props.theme.palette.background.default};
    position: fixed;
    inset: 0;
    margin: 0;
    width: 100vw;
    height: 100vh;
    text-align: center;
    padding: ${(props) => props.theme.spacing(2)};
    z-index: ${baseTheme.zindex.siteMap};

    & > ul > li {
      margin-bottom: ${(props) => props.theme.spacing(2)};
    }

    & > ul > li > ul {
      display: none;
    }

    ul {
      padding-left: 0;
    }
  }
`;

const Album = styled('ul')`
  padding-left: ${(props) => props.theme.spacing(1)};
  font-weight: normal;
`;

const Item = styled('li', transientOptions)<{ $isSelected: boolean }>`
  ${(props) => props.$isSelected && `font-weight: bold;`}
`;

const Form = styled('form')`
  margin: ${(props) => props.theme.spacing(2)} 0 ${(props) => props.theme.spacing(1)} 0;
`;

const License = styled('div')`
  margin: ${(props) => props.theme.spacing(2)} 0 ${(props) => props.theme.spacing(1)} 0;
  text-align: center;
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

const LogoWrapper = styled('li')`
  text-align: center;
  margin-bottom: ${(props) => props.theme.spacing(1)};
`;

const messages = defineMessages({
  menu: { defaultMessage: 'Menu' },
  search: { defaultMessage: 'search' },
});

const SITE_MAP_AND_USER_QUERY = gql`
  query SiteMapAndUser($username: String!) {
    fetchSiteMap(username: $username) {
      album
      forceRefresh
      hidden
      name
      section
      title
      username
    }

    fetchPublicUserData(username: $username) {
      username
      license
      logo
      name
      title
      sidebarHtml
      theme
      viewport
    }
  }
`;

export default function SiteMap({ content, username }: { content?: Content; username: string }) {
  const router = useRouter();
  const intl = useIntl();
  const theme = useTheme();
  const { user } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { loading, data, client } = useQuery<SiteMapAndUserQuery>(SITE_MAP_AND_USER_QUERY, {
    variables: {
      username,
    },
  });
  const menuButtonLabel = intl.formatMessage(messages.menu);
  const searchLabel = intl.formatMessage(messages.search);

  useEffect(() => {
    if (user?.username === username) {
      // @ts-ignore
      client.refetchQueries({
        include: [
          {
            query: SITE_MAP_AND_USER_QUERY,
            variables: {
              username,
            },
          },
        ],
      });
    }

    // eslint-disable-next-line
  }, [user, username]);

  function generateItem(item: SiteMapAndUserQuery['fetchSiteMap'][0], albums?: ReactNode) {
    const isSelected = item.name === content?.name || item.name === content?.album || item.name === content?.section;
    return (
      <Item key={item.name} $isSelected={isSelected}>
        <ContentLink item={item} currentContent={content} className="notranslate">
          {item.title}
        </ContentLink>
        {albums}
      </Item>
    );
  }

  function generateItems(siteMap: SiteMapAndUserQuery['fetchSiteMap']) {
    const items = [];
    for (let i = 0; i < siteMap.length; ++i) {
      const item = siteMap[i];
      const nextItem = siteMap[i + 1];

      let albums;
      if (nextItem?.album === 'main') {
        const albumItems = [];
        for (i += 1; i < siteMap.length; ++i) {
          const albumItem = siteMap[i];
          if (albumItem.album === 'main') {
            albumItems.push(generateItem(albumItem));
          } else {
            i -= 1;
            break;
          }
        }
        albums = <Album>{albumItems}</Album>;
      }

      items.push(generateItem(item, albums));
    }

    return items;
  }

  const handleMobileClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSearchSubmit = (evt: FormEvent) => {
    evt.preventDefault();

    const form = evt.target as HTMLFormElement;
    const formUrl = new URL(form.action);
    const query = form['q'].value;
    const url = buildUrl({ pathname: `/${username}${formUrl.pathname}/${query}` });
    router.push(url);
  };

  if (loading) {
    return (
      <>
        <Hamburger
          aria-label={menuButtonLabel}
          onClick={handleMobileClick}
          size="large"
          sx={{ color: theme.palette.text.primary }}
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </Hamburger>
        <Nav $isMenuOpen={isMenuOpen} />
      </>
    );
  }

  if (!data) {
    return null;
  }

  const siteMap = data.fetchSiteMap;
  const contentOwner = data.fetchPublicUserData;

  if (!siteMap || !contentOwner) {
    return null;
  }

  const items = generateItems(siteMap);

  return (
    <>
      <Hamburger
        id="hw-hamburger"
        aria-label={menuButtonLabel}
        onClick={handleMobileClick}
        size="large"
        sx={{ color: theme.palette.text.primary }}
      >
        {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
      </Hamburger>
      <Nav id="hw-sitemap" $isMenuOpen={isMenuOpen} onMouseUp={handleCloseMenu}>
        <ul>
          {contentOwner.logo ? (
            <LogoWrapper id="hw-sitemap-logo" className="h-card">
              <Link
                href={profileUrl(username)}
                className="u-url u-uid"
                sx={{ display: 'flex', justifyContent: 'center' }}
              >
                <Avatar
                  className="u-photo"
                  src={contentOwner.logo}
                  title={contentOwner.title}
                  alt={contentOwner.name || username}
                  sx={{ width: 64, height: 64 }}
                />
              </Link>
            </LogoWrapper>
          ) : null}
          {isMenuOpen && (
            <li>
              <LoginLogoutButton />
            </li>
          )}
          <li>
            <Link href={profileUrl(username)}>
              <F defaultMessage="home" />
            </Link>
          </li>

          {items}
        </ul>

        <Form method="get" action="/search" onSubmit={handleSearchSubmit} className="notranslate">
          <TextField aria-label={searchLabel} size="small" type="search" name="q" placeholder="search" required />
        </Form>

        {contentOwner.license ? (
          <License className="notranslate">
            {contentOwner.license === 'http://purl.org/atompub/license#unspecified' ? (
              `Copyright ${new Date().getFullYear()} by ${contentOwner.name}`
            ) : (
              <Link href={contentOwner.license} target="_blank">
                {/* @ts-ignore */}
                <Image width={44} height={15} src={constants.licenses[contentOwner.license].img} alt="license" />
              </Link>
            )}
          </License>
        ) : null}

        {contentOwner.sidebarHtml ? (
          <div className="notranslate" dangerouslySetInnerHTML={{ __html: contentOwner.sidebarHtml }} />
        ) : null}

        <Box id="hw-powered-by" sx={{ textAlign: 'center', mt: 2, fontSize: theme.typography.subtitle1 }}>
          <F
            defaultMessage="powered by {br} {link}"
            values={{
              br: <br />,
              link: (
                <Link href="https://github.com/mimecuvalo/helloworld" rel="generator">
                  Hello, world.
                </Link>
              ),
            }}
          />
        </Box>
      </Nav>
    </>
  );
}
