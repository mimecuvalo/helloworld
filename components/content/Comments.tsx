import { lazy, Suspense } from 'react';
import { F, defineMessages, useIntl } from 'i18n';
import { useUser } from 'lib/user-context';
import Favorite from 'components/dashboard/actions/Favorite';
import Delete from 'components/dashboard/actions/Delete';
import styles from './content.module.css';

const CommentsEditor = lazy(() => import('./CommentsEditor'));

type Comment = {
  postId: string;
  avatar?: string | null;
  creator?: string | null;
  username: string;
  fromUsername?: string | null;
  localContentName?: string | null;
  type: string;
  favorited?: boolean | null;
  deleted?: boolean | null;
  view: string;
};

const messages = defineMessages({
  avatar: { defaultMessage: 'avatar' },
});

export default function Comments({
  comments,
  content,
}: {
  comments?: Comment[];
  content: { username: string; name: string };
}) {
  const intl = useIntl();
  const user = useUser();
  const ariaImgMsg = intl.formatMessage(messages.avatar);
  const isLoggedIn = !!user;
  const isOwnerViewing = user?.username === content.username;

  return (
    <div className="hw-comments">
      <h4 className={styles.commentsHeading}>
        <F defaultMessage="comments" />{' '}
        {!isLoggedIn ? (
          <a href="/api/auth/signin">
            <F defaultMessage="Login" />
          </a>
        ) : null}
      </h4>

      {isLoggedIn ? (
        <Suspense fallback={<div />}>
          <CommentsEditor content={content} />
        </Suspense>
      ) : null}

      {comments?.length ? (
        <ul className={styles.comments}>
          {comments.map((comment) => (
            <li key={comment.postId} className={`${styles.comment} notranslate`}>
              <img className={styles.commentAvatar} src={comment.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
              <div>
                {comment.fromUsername ? (
                  <a href={comment.fromUsername} target="_blank" rel="noopener noreferrer">
                    {comment.creator || comment.username}
                  </a>
                ) : (
                  <strong>{comment.creator || comment.username}: </strong>
                )}
                <div dangerouslySetInnerHTML={{ __html: comment.view }} />
                {isOwnerViewing ? (
                  <>
                    <Favorite contentRemote={comment} />
                    <Delete contentRemote={comment} />
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
