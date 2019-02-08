import classNames from 'classnames';
import CloseIcon from '@material-ui/icons/Close';
import constants from '../../shared/constants';
import { contentUrl, navUrl } from '../../shared/util/url_factory';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import IconButton from '@material-ui/core/IconButton';
import { Link } from 'react-router-dom';
import MenuIcon from '@material-ui/icons/Menu';
import React, { Component } from 'react';
import styles from './SiteMap.module.css';

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
    options: ({ content: { username } }) => ({
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
    const content = this.props.content;

    const isSelected = item.name === content.name || item.name === content.album || item.name === content.section;
    return (
      <li id={`hw-sitemap-${item.name}`} key={item.name} className={styles.item}>
        <Link
          to={contentUrl(item)}
          className={classNames({
            'hw-selected': isSelected,
            [styles.selected]: isSelected,
            [styles.hidden]: item.hidden,
          })}
          target={item.forceRefresh || content.forceRefresh ? '_self' : ''}
        >
          {item.title}
        </Link>
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

  render() {
    if (this.props.data.loading) {
      return null;
    }

    const content = this.props.content;
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
                <a id="hw-sitemap-logo" href={navUrl(content.username)}>
                  <img src={contentOwner.logo} title={contentOwner.title} alt={logoAltText} />
                </a>
              </li>
            ) : null}
            <li>
              <a
                id="hw-sitemap-home"
                href={navUrl(content.username)}
                className={classNames({ 'hw-selected': content.name === 'home' })}
              >
                <F msg="home" />
              </a>
            </li>

            {items}
          </ul>

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

export default injectIntl(SiteMap);
