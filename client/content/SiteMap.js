import classNames from 'classnames';
import { contentUrl, navUrl } from '../../shared/util/url_factory';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './SiteMap.module.css';

const messages = defineMessages({
  logo: { msg: 'logo' },
});

@graphql(gql`
  query SiteMapAndUserQuery($username: String!) {
    fetchSiteMap(username: $username) {
      album
      hidden
      name
      section
      title
      username
    }

    fetchPublicUserData(username: $username) {
      logo
    }
  }
`, {
  options: ({ content: { username } }) => ({
    variables: {
      username,
    }
  })
})
class SiteMap extends PureComponent {
  generateItem(item, albums) {
    const content = this.props.content;

    return (
      <li key={item.name} className={styles.item}>
        <a href={contentUrl(item)}
            className={classNames({
              [styles.selected]: item.name === content.name,
              [styles.hidden]: item.hidden,
            })}>
          {item.title}
        </a>
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
      if (nextItem && nextItem.album === 'main') {
        const albumItems = [];
        for (i += 1; i < siteMap.length; ++i) {
          const albumItem = siteMap[i];
          if (albumItem.album === 'main') {
            albumItems.push(this.generateItem(albumItem));
          } else {
            break;
          }
        }
        albums = <ul className={styles.album}>{albumItems}</ul>;
      }

      items.push(this.generateItem(item, albums));
    }

    return items;
  }

  render() {
    const content = this.props.content;
    const siteMap = this.props.data.fetchSiteMap;
    const contentOwner = this.props.data.fetchPublicUserData;
    const logoAltText = this.props.intl.formatMessage(messages.logo);

    const items = this.generateItems(siteMap);

    return (
      <nav className={styles.sitemap}>
        <a href={navUrl(content.username)}>
          <img src={contentOwner.logo} title={contentOwner.title} alt={logoAltText} />
        </a>
        <ul>
          <li>
            <a href={navUrl(content.username)} className={classNames({ 'hw-selected': content.name === 'home' })}>
              <F msg="home" />
            </a>
          </li>

          {items}
        </ul>
      </nav>
    );
  }
}

export default injectIntl(SiteMap);
