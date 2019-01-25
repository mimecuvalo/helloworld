import classNames from 'classnames';
import { F } from '../../shared/i18n';
import Feed from './Feed';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import Item from './Item';
import Nav from './Nav';
import React, { PureComponent } from 'react';
import Simple from './templates/Simple';
import SiteMap from './SiteMap';
import styles from './Content.module.css';

@graphql(
  gql`
    query ContentAndUserQuery($username: String!, $name: String!) {
      fetchContent(username: $username, name: $name) {
        album
        code
        comments_count
        comments_updated
        count
        count_robot
        date_created
        date_updated
        hidden
        name
        order
        redirect
        section
        sort_type
        style
        template
        thumb
        title
        username
        view
      }

      fetchPublicUserData(username: $username) {
        title
        description
      }
    }
  `,
  {
    options: ({
      match: {
        params: { username, name },
      },
    }) => ({
      variables: {
        username: username || '',
        name: username ? name || 'home' : '',
      },
    }),
  }
)
class Content extends PureComponent {
  render() {
    const content = this.props.data.fetchContent;

    if (content.template === 'blank') {
      return (
        <div id="hw-content">
          <Simple content={content} />
        </div>
      );
    }

    const contentOwner = this.props.data.fetchPublicUserData;
    const item = content.template === 'feed' ? <Feed content={content} /> : <Item content={content} />;

    return (
      <div id="hw-content" className={styles.container}>
        <header>
          <h1>{contentOwner.title}</h1>
          <h2>{contentOwner.description}</h2>
        </header>

        <div className={styles.articleNavContainer}>
          <SiteMap content={content} />

          <article className={classNames(styles.content, 'hw-invisible-transition')}>
            <Nav content={content} />
            {item}
          </article>
        </div>

        <footer className={styles.footer}>
          <F
            msg="powered by {br} {link}"
            values={{
              br: <br />,
              link: (
                <a href="https://github.com/mimecuvalo/helloworld" rel="generator">
                  Hello, world.
                </a>
              ),
            }}
          />
        </footer>
      </div>
    );
  }
}

export default Content;
