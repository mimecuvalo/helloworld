import { F, defineMessages, useIntl } from 'shared/util/i18n';
import { buildUrl, profileUrl } from 'shared/util/url_factory';

import CloseIcon from '@material-ui/icons/Close';
import ContentLink from 'client/components/ContentLink';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import classNames from 'classnames';
import constants from 'shared/constants';
import { createUseStyles } from 'react-jss';
import gql from 'graphql-tag';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useState } from 'react';

const useStyles = createUseStyles({
  sitemap: {
    margin: 'var(--app-margin)',
    minWidth: '155px',
    padding: '6px',
  },
  album: {
    paddingLeft: '7px',
  },
  selected: {
    fontWeight: 'bold',
  },
  item: {
    wordWrap: 'break-word',
  },
  search: {
    margin: '20px 0 10px 0',
  },
  searchInput: {
    width: '100%',
  },
  license: {
    margin: '20px 0 10px 0',
    textAlign: 'center',
    fontSize: '10px',
  },
  hamburger: {
    display: 'none !important',
  },
  logoWrapper: {
    textAlign: 'center',
  },
  logo: {
    borderRadius: '50%',
    marginBottom: '10px',
  },
});

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

export default function SiteMap({ content, username }) {
  const routerHistory = useHistory();
  const intl = useIntl();
  const [forceMenuOpen, setForceMenuOpen] = useState(false);
  const { loading, data } = useQuery(SITE_MAP_AND_USER_QUERY, {
    variables: {
      username,
    },
  });
  const styles = useStyles();

  function generateItem(item, albums) {
    content = content || {};

    const isSelected = item.name === content.name || item.name === content.album || item.name === content.section;
    return (
      <li id={`hw-sitemap-${item.name}`} key={item.name} className={styles.item}>
        <ContentLink
          item={item}
          currentContent={content}
          className={classNames({ 'hw-selected': isSelected, [styles.selected]: isSelected }, 'notranslate')}
        >
          {item.title}
        </ContentLink>
        {albums}
      </li>
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
        albums = <ul className={styles.album}>{albumItems}</ul>;
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
    routerHistory.push(url);
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
      <IconButton
        className={classNames(styles.hamburger, 'hw-sitemap-hamburger')}
        aria-label={menuButtonLabel}
        onClick={handleMobileClick}
      >
        {forceMenuOpen ? <CloseIcon /> : <MenuIcon />}
      </IconButton>
      <nav
        id="hw-sitemap"
        className={classNames(styles.sitemap, {
          'hw-sitemap-open': forceMenuOpen,
        })}
      >
        <ul>
          {contentOwner.logo ? (
            <li className={classNames(styles.logoWrapper, 'h-card')}>
              <a id="hw-sitemap-logo" href={profileUrl(username)} className="u-url u-uid">
                <img
                  className={classNames(styles.logo, 'u-photo')}
                  src={contentOwner.logo}
                  title={contentOwner.title}
                  alt={contentOwner.name || username}
                />
              </a>
            </li>
          ) : null}
          <li>
            <a
              id="hw-sitemap-home"
              href={profileUrl(username)}
              className={classNames({ 'hw-selected': content.name === 'home' })}
            >
              <F defaultMessage="home" />
            </a>
          </li>

          {items}
        </ul>

        <form
          method="get"
          action="/search"
          onSubmit={handleSearchSubmit}
          className={classNames(styles.search, 'notranslate')}
        >
          <input
            aria-label={searchLabel}
            type="search"
            name="q"
            placeholder="search"
            required
            className={styles.searchInput}
          />
        </form>

        {contentOwner.license ? (
          <div className={classNames(styles.license, 'notranslate')}>
            {contentOwner.license === 'http://purl.org/atompub/license#unspecified' ? (
              `Copyright ${new Date().getFullYear()} by ${contentOwner.name}`
            ) : (
              <a href={contentOwner.license} target="_blank" rel="noopener noreferrer">
                <img src={constants.licenses[contentOwner.license].img} alt="license" />
              </a>
            )}
          </div>
        ) : null}

        {contentOwner.sidebar_html ? (
          <div className="notranslate" dangerouslySetInnerHTML={{ __html: contentOwner.sidebar_html }} />
        ) : null}
      </nav>
    </>
  );
}
