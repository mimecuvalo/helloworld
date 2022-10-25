import { Content, SiteMapAndUserQuery } from 'data/graphql-generated';
import { F, defineMessages, useIntl } from 'i18n';
import { FormEvent, ReactNode, useState } from 'react';
import { IconButton, styled } from 'components';
import { buildUrl, profileUrl } from 'util/url-factory';
import { gql, useQuery } from '@apollo/client';

import CloseIcon from '@mui/icons-material/Close';
import ContentLink from 'components/ContentLink';
import Image from 'next/image';
import MenuIcon from '@mui/icons-material/Menu';
import constants from 'util/constants';
import { transientOptions } from 'util/css';
import { useRouter } from 'next/router';

const Nav = styled('nav', transientOptions)<{ $forceMenuOpen: boolean }>`
  margin: ${(props) => props.theme.spacing(1)};
  min-width: 155px;
  padding: 6px;
`;

const Album = styled('ul')`
  padding-left: 7px;
  font-weight: normal;
`;

const Item = styled('li', transientOptions)<{ $isSelected: boolean }>`
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
  // TODO(mime): wtf
  const [forceMenuOpen, setForceMenuOpen] = useState(false);
  const { loading, data } = useQuery<SiteMapAndUserQuery>(SITE_MAP_AND_USER_QUERY, {
    variables: {
      username,
    },
  });

  function generateItem(item: SiteMapAndUserQuery['fetchSiteMap'][0], albums?: ReactNode) {
    const isSelected = item.name === content?.name || item.name === content?.album || item.name === content?.section;
    return (
      <Item
        id={`hw-sitemap-${item.name}`}
        key={item.name}
        $isSelected={isSelected}
        data-x={JSON.stringify({ content, item })}
      >
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

  const handleSearchSubmit = (evt: FormEvent) => {
    evt.preventDefault();

    const form = evt.target as HTMLFormElement;
    const formUrl = new URL(form.action);
    const query = form['q'].value;
    const url = buildUrl({ pathname: `/${username}${formUrl.pathname}/${query}` });
    router.push(url);
  };

  if (loading || !data) {
    return null;
  }

  const siteMap = data.fetchSiteMap;
  const contentOwner = data.fetchPublicUserData;
  const menuButtonLabel = intl.formatMessage(messages.menu);
  const searchLabel = intl.formatMessage(messages.search);

  if (!siteMap || !contentOwner) {
    return null;
  }

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
              <a href={profileUrl(username)} className="u-url u-uid">
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
            <a href={profileUrl(username)}>
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
                {/* @ts-ignore */}
                <Image width={44} height={15} src={constants.licenses[contentOwner.license].img} alt="license" />
              </a>
            )}
          </License>
        ) : null}

        {contentOwner.sidebarHtml ? (
          <div className="notranslate" dangerouslySetInnerHTML={{ __html: contentOwner.sidebarHtml }} />
        ) : null}
      </Nav>
    </>
  );
}
