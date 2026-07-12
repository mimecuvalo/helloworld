import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import styles from '../dashboard.module.css';

type FavoritableRemote = {
  favorited?: boolean | null;
  fromUsername?: string | null;
  postId: string;
  type: string;
};

const messages = defineMessages({
  favorite: { defaultMessage: 'Favorite' },
});

export default function Favorite({
  contentRemote,
  isDashboard,
}: {
  contentRemote: FavoritableRemote;
  isDashboard?: boolean;
}) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const [favorited, setFavorited] = useState(!!contentRemote.favorited);

  const mutation = useMutation({
    mutationFn: (favoritedNext: boolean) =>
      rpc.api['content-remote'].favorite
        .$post({
          json: {
            fromUsername: contentRemote.fromUsername || '',
            postId: contentRemote.postId,
            type: contentRemote.type,
            favorited: favoritedNext,
          },
        })
        .then((r) => {
          if (!r.ok) throw new Error('favorite failed');
          return r.json();
        }),
    onSuccess: () => {
      if (isDashboard) queryClient.invalidateQueries({ queryKey: ['feed-counts'] });
    },
  });

  const handleClick = () => {
    const next = !favorited;
    setFavorited(next);
    mutation.mutate(next, { onError: () => setFavorited(!next) });
  };

  return (
    <button
      type="button"
      className={`${styles.actionButton} ${favorited ? styles.actionActive : ''}`}
      onClick={handleClick}
      title={intl.formatMessage(messages.favorite)}
      aria-pressed={favorited}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
