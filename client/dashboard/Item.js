import Footer from './Footer';
import Header from './Header';
import React, { PureComponent } from 'react';

class Item extends PureComponent {
  render() {
    const contentRemote = this.props.contentRemote;

    return (
      <section className="hw-item">
        <Header contentRemote={contentRemote} />
        <div dangerouslySetInnerHTML={{ __html: contentRemote.view }} />
        <Footer contentRemote={contentRemote} />
      </section>
    );
  }
}

export default Item;
