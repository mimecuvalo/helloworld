import classNames from 'classnames';
import React from 'react';
import styles from './Simple.module.css';

const Simple = React.memo(({ content }) =>
  <>
    <div dangerouslySetInnerHTML={{ __html: content.style }} />
    <div dangerouslySetInnerHTML={{ __html: content.code }} />
    <div dangerouslySetInnerHTML={{ __html: content.view }} className={classNames(styles.view, 'hw-view')} />
  </>
);

export default Simple;
