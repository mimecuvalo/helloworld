import classNames from 'classnames';
import { F } from '../../shared/i18n';
import React from 'react';
import SiteMap from './SiteMap';
import styles from './Content.module.css';
import useDocumentTitle from '../app/title';

export default React.memo(
  React.forwardRef((props, ref) => {
    const { children, className, contentOwner, title, username } = props;
    useDocumentTitle(title);

    return (
      <div ref={ref} id="hw-content" className={classNames(styles.container, className)}>
        <header>
          <h1>{`${contentOwner.title}` + (title ? ` - ${title}` : '')}</h1>
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
    );
  })
);
