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
    const { content, comments, favorites, handleEdit, isEditing, isFeed } = this.props;
    let TemplateComponent = COMPONENT_TYPE_MAP[content.template] || Simple;

    return (
      <article className="hw-item h-entry">
        <Header content={content} handleEdit={handleEdit} isEditing={isEditing} />
        <TemplateComponent ref={this.template} content={content} isEditing={isEditing} isFeed={isFeed} />
        <Footer content={content} />
        {!isFeed ? <Comments comments={comments} content={content} /> : null}
        {!isFeed ? <Favorites favorites={favorites} content={content} /> : null}
      </article>
    );
  }
}
