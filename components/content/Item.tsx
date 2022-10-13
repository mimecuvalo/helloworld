import { animated, useTransition } from 'react-spring';
import { useImperativeHandle, useRef } from 'react';

import Album from './templates/Album';
import Archive from './templates/Archive';
import Comments from './Comments';
import Favorites from './Favorites';
import Footer from './Footer';
import Header from './Header';
import Latest from './templates/Latest';
import Simple from './templates/Simple';
import classNames from 'classnames';

const COMPONENT_TYPE_MAP = {
  album: Album,
  archive: Archive,
  latest: Latest,
  links: Album,
};

export default function Item(props) {
  const transitions = useTransition(props.content, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { display: 'none', opacity: 0 },
  });

  // TODO
  //const template = useRef(null);

  // useImperativeHandle(ref, () => ({
  //   getEditor: () => {
  //     return template.current?.getEditor && template.current.getEditor();
  //   },
  // }));

  const { className, content, contentOwner, comments, favorites, handleEdit, isEditing, isFeed } = props;
  let TemplateComponent = COMPONENT_TYPE_MAP[content.template] || Simple;
  const contentComponent = <TemplateComponent ref={template} content={content} isEditing={isEditing} isFeed={isFeed} />;

  return (
    <article className={classNames('hw-item', 'h-entry', className)}>
      <Header content={content} handleEdit={handleEdit} isEditing={isEditing} />
      {COMPONENT_TYPE_MAP[content.template]
        ? contentComponent
        : transitions((style, item) => <animated.div style={style}>{contentComponent}</animated.div>)}
      <Footer content={content} contentOwner={contentOwner} />
      {!isFeed ? <Comments comments={comments} content={content} /> : null}
      {!isFeed ? <Favorites favorites={favorites} content={content} /> : null}
    </article>
  );
}
