import { F, defineMessages, useIntl } from 'i18n';
import { IconButton, styled } from 'components';
import { ReactNode, useState } from 'react';
import { buildUrl, profileUrl } from 'util/url-factory';
import { gql, useQuery } from '@apollo/client';

import CloseIcon from '@mui/icons-material/Close';
import { Content } from '@prisma/client';
import ContentLink from 'components/ContentLink';
import MenuIcon from '@mui/icons-material/Menu';
import constants from 'util/constants';
import { useRouter } from 'next/router';

const Nav = styled('nav')<{ $forceMenuOpen: boolean }>`
  margin: var(--app-margin);
  min-width: 155px;
  padding: 6px;
`;

const Album = styled('ul')`
  padding-left: 7px;
`;

const Item = styled('li')<{ $isSelected: boolean }>`
  ${(props) => props.$isSelected && `font-weight: bold;`}
`;

const Form = styled('form')`
  margin: 20px 0 10px 0;
`;

const License = styled('div')`
  margin: 20px 0 10px 0;
  text-align: center;
  font-size: 10px;
`;

const Hamburger = styled(IconButton)`
  display: none !important;
`;

const LogoWrapper = styled('li')`
  text-align: center;
`;

const Logo = styled('img')`
  border-radius: 50%;
  margin-bottom: 10px;
`;

const messages = defineMessages({
  menu: { defaultMessage: 'Menu' },
  search: { defaultMessage: 'search' },
});

const SITE_MAP_AND_USER_QUERY = gql`
  query SiteMapAndUserQuery($username: String!) {
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
      license
      logo
      name
      sidebar_html
    }
  }
`;

export default function SiteMap({ content, username }: { content: Content; username: string }) {
  const router = useRouter();
  const intl = useIntl();
  // TODO(mime): wtf
  const [forceMenuOpen, setForceMenuOpen] = useState(false);
  const { loading, data } = useQuery(SITE_MAP_AND_USER_QUERY, {
    variables: {
      username,
    },
  });

  function generateItem(item: Content, albums: ReactNode) {
    content = content || {};

    const isSelected = item.name === content.name || item.name === content.album || item.name === content.section;
    return (
      <Item id={`hw-sitemap-${item.name}`} key={item.name} $isSelected={isSelected}>
        <ContentLink item={item} currentContent={content} className="notranslate">
          {item.title}
        </ContentLink>
        {albums}
      </Item>
    );
  }

  function generateItems(siteMap) {
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

  const closeMenuOnClick = () => {
    setForceMenuOpen(false);
    window.removeEventListener('click', closeMenuOnClick);
  };

  const handleMobileClick = () => {
    setForceMenuOpen(!forceMenuOpen);

    // Wait a tick so we don't auto-close ourselves.
    setTimeout(() => {
      window.addEventListener('click', closeMenuOnClick);
    }, 0);
  };

  const handleSearchSubmit = (evt) => {
    evt.preventDefault();

    const form = evt.target;
    const formUrl = new URL(form.action);
    const query = form.q.value;
    const url = buildUrl({ pathname: `/${username}${formUrl.pathname}/${query}` });
    router.push(url);
  };

  if (loading) {
    return null;
  }

  content = content || {};
  const siteMap = data.fetchSiteMap;
  const contentOwner = data.fetchPublicUserData;
  const menuButtonLabel = intl.formatMessage(messages.menu);
  const searchLabel = intl.formatMessage(messages.search);

  const items = generateItems(siteMap);

  return (
    <>
      <Hamburger className="hw-sitemap-hamburger" aria-label={menuButtonLabel} onClick={handleMobileClick} size="large">
        {forceMenuOpen ? <CloseIcon /> : <MenuIcon />}
      </Hamburger>
      <Nav id="hw-sitemap" $forceMenuOpen={forceMenuOpen}>
        <ul>
          {contentOwner.logo ? (
            <LogoWrapper className="h-card">
              <a id="hw-sitemap-logo" href={profileUrl(username)} className="u-url u-uid">
                <Logo
                  className="u-photo"
                  src={contentOwner.logo}
                  title={contentOwner.title}
                  alt={contentOwner.name || username}
                />
              </a>
            </LogoWrapper>
          ) : null}
          <li>
            <a
              id="hw-sitemap-home"
              href={profileUrl(username)}
              className={content.name === 'home' ? 'hw-selected' : ''}
            >
              <F defaultMessage="home" />
            </a>
          </li>

          {items}
        </ul>

        <Form method="get" action="/search" onSubmit={handleSearchSubmit} className="notranslate">
          <input aria-label={searchLabel} type="search" name="q" placeholder="search" required />
        </Form>

        {contentOwner.license ? (
          <License className="notranslate">
            {contentOwner.license === 'http://purl.org/atompub/license#unspecified' ? (
              `Copyright ${new Date().getFullYear()} by ${contentOwner.name}`
            ) : (
              <a href={contentOwner.license} target="_blank" rel="noopener noreferrer">
                <img src={constants.licenses[contentOwner.license].img} alt="license" />
              </a>
            )}
          </License>
        ) : null}

        {contentOwner.sidebar_html ? (
          <div className="notranslate" dangerouslySetInnerHTML={{ __html: contentOwner.sidebar_html }} />
        ) : null}
      </Nav>
    </>
  );
}
