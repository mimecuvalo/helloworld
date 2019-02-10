import { buildUrl, profileUrl } from '../../shared/util/url_factory';
import classNames from 'classnames';
import CloseIcon from '@material-ui/icons/Close';
import constants from '../../shared/constants';
import ContentLink from '../components/ContentLink';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import React, { Component } from 'react';
import styles from './SiteMap.module.css';
import { withRouter } from 'react-router-dom';

const messages = defineMessages({
  logo: { msg: 'logo' },
  menu: { msg: 'Menu' },
});

@graphql(
  gql`
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
      }
    }
  `,
  {
    options: ({ username }) => ({
      variables: {
        username,
      },
    }),
  }
)
class SiteMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      forceMenuOpen: false,
    };
  }

  generateItem(item, albums) {
    const content = this.props.content || {};

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

  generateItems(siteMap, i = 0) {
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
            albumItems.push(this.generateItem(albumItem));
          } else {
            i -= 1;
            break;
          }
        }
        albums = <ul className={styles.album}>{albumItems}</ul>;
      }

      items.push(this.generateItem(item, albums));
    }

    return items;
  }

  handleMobileClick = () => {
    this.setState({ forceMenuOpen: !this.state.forceMenuOpen });
  };

  handleSearchSubmit = evt => {
    evt.preventDefault();

    const form = evt.target;
    const formUrl = new URL(form.action);
    const username = this.props.username;
    const query = form.q.value;
    const url = buildUrl({ pathname: `/${username}${formUrl.pathname}/${query}` });
    this.props.history.push(url);
  };

  render() {
    if (this.props.data.loading) {
      return null;
    }

    const content = this.props.content || {};
    const username = this.props.username;
    const siteMap = this.props.data.fetchSiteMap;
    const contentOwner = this.props.data.fetchPublicUserData;
    const logoAltText = this.props.intl.formatMessage(messages.logo);
    const menuButtonLabel = this.props.intl.formatMessage(messages.menu);

    const items = this.generateItems(siteMap);

    return (
      <>
        <IconButton
          className={classNames(styles.hamburger, 'hw-sitemap-hamburger')}
          aria-label={menuButtonLabel}
          onClick={this.handleMobileClick}
        >
          {this.state.forceMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
        <nav
          id="hw-sitemap"
          className={classNames(styles.sitemap, {
            'hw-sitemap-open': this.state.forceMenuOpen,
          })}
        >
          <ul>
            {contentOwner.logo ? (
              <li>
                <a id="hw-sitemap-logo" href={profileUrl(username)}>
                  <img src={contentOwner.logo} title={contentOwner.title} alt={logoAltText} />
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

          <form method="get" action="/search" onSubmit={this.handleSearchSubmit} className={styles.search}>
            <input type="search" name="q" placeholder="search" required />
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
        </nav>
      </>
    );
  }
}

export default withRouter(injectIntl(SiteMap));
