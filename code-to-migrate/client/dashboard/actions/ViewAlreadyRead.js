import { F } from 'shared/util/i18n';
import MenuItem from '@material-ui/core/MenuItem';

export default function ViewAlreadyRead({ handleClose, handleSetFeed, userRemote }) {
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
