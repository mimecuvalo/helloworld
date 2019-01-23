import Album from './templates/Album';
import Archive from './templates/Archive';
import Footer from './Footer';
import Header from './Header';
import Latest from './templates/Latest';
import React, { PureComponent } from 'react';
import Simple from './templates/Simple';
import Slideshow from './templates/Slideshow';

const COMPONENT_TYPE_MAP = {
  'album': Album,
  'archive': Archive,
  'latest': Latest,
  'links': Album,
  'slideshow': Slideshow,
};

class Item extends PureComponent {
  render() {
    const content = this.props.content;
    let TemplateComponent = COMPONENT_TYPE_MAP[content.template] || Simple;

    return (
      <section>
        <Header content={content} />

        <div dangerouslySetInnerHTML={{ __html: content.style }} />
        <div dangerouslySetInnerHTML={{ __html: content.code }} />

        <TemplateComponent content={content} />

        <Footer content={content} />
      </section>
    );
  }
}

export default Item;
