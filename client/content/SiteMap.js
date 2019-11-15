import { buildUrl, profileUrl } from '../../shared/util/url_factory';
import classNames from 'classnames';
import CloseIcon from '@material-ui/icons/Close';
import constants from '../../shared/constants';
import ContentLink from '../components/ContentLink';
import { createUseStyles } from 'react-jss';
import { defineMessages, F, useIntl } from '../../shared/i18n';
import gql from 'graphql-tag';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@apollo/react-hooks';

const useStyles = createUseStyles({
  sitemap: {
    margin: 'var(--app-margin)',
    width: '155px',
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
  license: {
    margin: '20px 0 10px 0',
    textAlign: 'center',
    fontSize: '10px',
  },
  hamburger: {
    display: 'none !important',
  },
});

const messages = defineMessages({
  menu: { msg: 'Menu' },
  search: { msg: 'search' },
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
          className={classNames({ 'hw-selected': isSelected, [styles.selected]: isSelected })}
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

  const handleMobileClick = () => {
    setForceMenuOpen(!forceMenuOpen);
  };

  const handleSearchSubmit = evt => {
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
            <li className="h-card">
              <a id="hw-sitemap-logo" href={profileUrl(username)} className="u-url u-uid">
                <img
                  className="u-photo"
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
              <F msg="home" />
            </a>
          </li>

          {items}
        </ul>

        <form method="get" action="/search" onSubmit={handleSearchSubmit} className={styles.search}>
          <input aria-label={searchLabel} type="search" name="q" placeholder="search" required />
        </form>

        {contentOwner.license ? (
          <div className={styles.license}>
            {contentOwner.license === 'http://purl.org/atompub/license#unspecified' ? (
              `Copyright ${new Date().getFullYear()} by ${contentOwner.name}`
            ) : (
              <a href={contentOwner.license} target="_blank" rel="noopener noreferrer">
                <img src={constants.licenses[contentOwner.license].img} alt="license" />
              </a>
            )}
          </div>
        ) : null}

        {contentOwner.sidebar_html ? <div dangerouslySetInnerHTML={{ __html: contentOwner.sidebar_html }} /> : null}
      </nav>
    </>
  );
}
