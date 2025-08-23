import { Avatar, Link, List, ListItem, Login, Typography, styled } from 'components';
import { Comment as CommentType, Content } from 'data/graphql-generated';
import { F, defineMessages, useIntl } from 'i18n';
import { lazy, Suspense, useContext } from 'react';

import Delete from 'components/dashboard/actions/Delete';
import Favorite from 'components/dashboard/actions/Favorite';
import UserContext from 'application/UserContext';

const CommentsEditor = lazy(() => import('./CommentsEditor'));

const Comment = styled(ListItem)`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  margin-bottom: ${(props) => props.theme.spacing(1)};
  clear: both;

  button {
    min-width: 0;
    padding: ${(props) => props.theme.spacing(0.5)} ${(props) => props.theme.spacing(1)} 0 0;
  }
`;

const StyledComments = styled(List)`
  margin-top: ${(props) => props.theme.spacing(1)};
`;

const Author = styled('span')`
  font-weight: bold;
`;

const messages = defineMessages({
  avatar: { defaultMessage: 'avatar' },
});

export default function Comments({ comments, content }: { comments?: CommentType[]; content: Content }) {
  const intl = useIntl();
  const { user } = useContext(UserContext);
  const isLoggedIn = !!user;

  const ariaImgMsg = intl.formatMessage(messages.avatar);
  const isOwnerViewing = user?.username === content.username;

  return (
    <div>
      <Typography variant="h4" sx={{ marginTop: 3 }}>
        <F defaultMessage="comments" /> {!isLoggedIn && <Login />}
      </Typography>
      {isLoggedIn && (
        <Suspense fallback={<div />}>
          <CommentsEditor content={content} />
        </Suspense>
      )}
      {comments ? (
        <StyledComments>
          {comments.map((comment) => (
            <Comment key={comment.postId} className="notranslate">
              <Avatar
                src={comment.avatar || '/img/pixel.gif'}
                alt={ariaImgMsg}
                sx={{ width: 32, height: 32, marginRight: 2, marginTop: '7px' }}
              />
              <div>
                {comment.fromUsername ? (
                  <Link href={comment.fromUsername} target="_blank">
                    {comment.creator || comment.username}
                  </Link>
                ) : (
                  <Author>{comment.creator || comment.username}: </Author>
                )}
                <div dangerouslySetInnerHTML={{ __html: comment.view }} />

                {isOwnerViewing ? (
                  <>
                    <Favorite contentRemote={comment} />
                    <Delete contentRemote={comment} />
                  </>
                ) : null}
              </div>
            </Comment>
          ))}
        </StyledComments>
      ) : null}
    </div>
  );
}
