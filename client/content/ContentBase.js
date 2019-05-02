import classNames from 'classnames';
import DocumentTitle from 'react-document-title';
import { F } from '../../shared/i18n';
import React from 'react';
import SiteMap from './SiteMap';
import styles from './Content.module.css';

const ContentBase = React.memo(function ContentBase({ children, className, content, contentOwner, title, username }) {
  return (
    <DocumentTitle title={title}>
      <div id="hw-content" className={classNames(styles.container, className)}>
        <header>
          <h1 className="p-summary">{`${contentOwner.title}` + (title ? ` - ${title}` : '')}</h1>
          <h2>{contentOwner.description}</h2>
        </header>

        <div className={styles.articleNavContainer}>
          <SiteMap username={username} />

          {children}
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
    </DocumentTitle>
  );
});

export default ContentBase;
