import classNames from 'classnames';
import React from 'react';
import styles from './Simple.module.css';

const Simple = React.memo(({ content }) =>
  <div className={classNames(styles.view, 'hw-view')} dangerouslySetInnerHTML={{ __html: content.view }} />
);

export default Simple;
