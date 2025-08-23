import { Comment, Content, Favorite, UserPublic } from 'data/graphql-generated';
import { ItemWrapper, styled } from 'components';

import Album from './templates/Album';
import Archive from './templates/Archive';
import Comments from './Comments';
import Favorites from './Favorites';
import Footer from './Footer';
import Header from './Header';
import Latest from './templates/Latest';
import Simple from './templates/Simple';

const StyledItem = styled('article', { label: 'Item' })`
  display: flex;
  flex-direction: column;
  height: 100%;

  // HTML Normalization below, used for Content.
  & p {
    margin-block: 0;
    margin-inline: 0;
  }
`;

const InnerView = styled('div', { label: 'InnerView' })`
  flex: 1;
  display: flex;
  align-items: center;
`;

const COMPONENT_TYPE_MAP = {
  album: Album,
  archive: Archive,
  latest: Latest,
  links: Album,
};

export default function Item(props: {
  className?: string;
  content: Content;
  contentOwner: UserPublic;
  comments?: Comment[];
  favorites?: Favorite[];
  isFeed?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const { className, content, contentOwner, comments, favorites, isFeed } = props;
  const template = content.template as keyof typeof COMPONENT_TYPE_MAP;
  const TemplateComponent = COMPONENT_TYPE_MAP[template] || Simple;
  const contentComponent = <TemplateComponent content={content} />;

  return (
    <ItemWrapper ref={props.ref}>
      <StyledItem className={`hw-item h-entry ${className || ''}`}>
        <Header content={content} />
        {COMPONENT_TYPE_MAP[template] ? contentComponent : <InnerView>{contentComponent}</InnerView>}
        <Footer content={content} contentOwner={contentOwner} />
        {!isFeed ? <Comments comments={comments} content={content} /> : null}
        {!isFeed && favorites?.length ? <Favorites favorites={favorites} /> : null}
      </StyledItem>
    </ItemWrapper>
  );
}
