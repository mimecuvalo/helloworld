import Album from './templates/Album';
import Archive from './templates/Archive';
import Comments from './Comments';
import Favorites from './Favorites';
import Footer from './Footer';
import Header from './Header';
import Latest from './templates/Latest';
import React, { PureComponent } from 'react';
import Simple from './templates/Simple';

const COMPONENT_TYPE_MAP = {
  album: Album,
  archive: Archive,
  latest: Latest,
  links: Album,
};

export default class Item extends PureComponent {
  constructor(props) {
    super(props);

    this.template = React.createRef();
  }

  getEditor() {
    return this.template.current?.getEditor && this.template.current.getEditor();
  }

  render() {
    const { content, comments, favorites, handleEdit, isEditing } = this.props;
    let TemplateComponent = COMPONENT_TYPE_MAP[content.template] || Simple;

    return (
      <section className="hw-item">
        <Header content={content} handleEdit={handleEdit} isEditing={isEditing} />
        <TemplateComponent ref={this.template} content={content} isEditing={isEditing} isFeed={this.props.isFeed} />
        <Footer content={content} />
        <Comments comments={comments} content={content} />
        <Favorites favorites={favorites} content={content} />
      </section>
    );
  }
}
