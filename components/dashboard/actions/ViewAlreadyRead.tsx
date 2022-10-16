import { F } from 'i18n';
import { MenuItem } from 'components';
import { UserRemotePublic } from 'data/graphql-generated';

export default function ViewAlreadyRead({
  handleClose,
  handleSetFeed,
  userRemote,
}: {
  handleClose: () => void;
  handleSetFeed: (userRemote: UserRemotePublic | string, query?: any, allItems?: boolean) => void;
  userRemote: UserRemotePublic;
}) {
  const handleClick = async () => {
    handleClose();

    handleSetFeed(userRemote, undefined /* query */, true /* all items */);
  };

  return (
    <MenuItem onClick={handleClick}>
      <F defaultMessage="view all items" />
    </MenuItem>
  );
}
