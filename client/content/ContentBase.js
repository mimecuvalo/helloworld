import { forwardRef, memo } from 'react';

import { F } from 'react-intl-wrapper';
import SiteMap from './SiteMap';
import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
import useDocumentTitle from 'client/app/title';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    '& > header': {
      display: 'none',
    },
  },
  articleNavContainer: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  footer: {
    width: '154px',
    marginLeft: '6px',
    padding: '10px 0',
    fontSize: '11px',
    textAlign: 'center',
  },
});

export default memo(
  forwardRef((props, ref) => {
    const { children, className, contentOwner, title, username } = props;
    useDocumentTitle(title);
    const styles = useStyles();

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
