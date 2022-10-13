import { F } from 'i18n';
import { MenuItem } from 'components';

export default function ViewAlreadyRead({
  handleClose,
  handleSetFeed,
  userRemote,
}: {
  handleClose: () => void;
  handleSetFeed: (userRemote: string, query?: any, allItems?: boolean) => void;
  userRemote: User;
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
