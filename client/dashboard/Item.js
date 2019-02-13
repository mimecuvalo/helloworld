import classNames from 'classnames';
import Footer from './Footer';
import Header from './Header';
import React, { PureComponent } from 'react';
import styles from './Item.module.css';

class Item extends PureComponent {
  render() {
    const contentRemote = this.props.contentRemote;

    return (
      <section className={classNames('hw-item', styles.item)}>
        <Header contentRemote={contentRemote} />
        <div dangerouslySetInnerHTML={{ __html: contentRemote.view }} />
        <Footer contentRemote={contentRemote} />
      </section>
    );
  }
}

export default Item;
