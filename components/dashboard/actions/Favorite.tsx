import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HeartFilledIcon, HeartIcon } from '@radix-ui/react-icons';
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
      // Only favoritesCount can move here, but it rides along with the rest of
      // the counts payload.
      if (isDashboard) queryClient.invalidateQueries({ queryKey: ['counts'] });
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
      {favorited ? (
        <HeartFilledIcon width={18} height={18} aria-hidden="true" />
      ) : (
        <HeartIcon width={18} height={18} aria-hidden="true" />
      )}
    </button>
  );
}
