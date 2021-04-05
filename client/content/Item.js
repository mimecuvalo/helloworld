import Album from './templates/Album';
import Archive from './templates/Archive';
import classNames from 'classnames';
import Comments from './Comments';
import Favorites from './Favorites';
import Footer from './Footer';
import Header from './Header';
import Latest from './templates/Latest';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import Simple from './templates/Simple';

const COMPONENT_TYPE_MAP = {
  album: Album,
  archive: Archive,
  latest: Latest,
  links: Album,
};

export default forwardRef((props, ref) => {
  const template = useRef(null);

  useImperativeHandle(ref, () => ({
    getEditor: () => {
      return template.current?.getEditor && template.current.getEditor();
    },
  }));

  const { className, content, contentOwner, comments, favorites, handleEdit, isEditing, isFeed } = props;
  let TemplateComponent = COMPONENT_TYPE_MAP[content.template] || Simple;

  return (
    <article className={classNames('hw-item', 'h-entry', className)}>
      <Header content={content} handleEdit={handleEdit} isEditing={isEditing} />
      <TemplateComponent ref={template} content={content} isEditing={isEditing} isFeed={isFeed} />
      <Footer content={content} contentOwner={contentOwner} />
      {!isFeed ? <Comments comments={comments} content={content} /> : null}
      {!isFeed ? <Favorites favorites={favorites} content={content} /> : null}
    </article>
  );
});
