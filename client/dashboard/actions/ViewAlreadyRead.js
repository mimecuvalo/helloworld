import { F } from 'react-intl-wrapper';
import MenuItem from '@material-ui/core/MenuItem';

export default function ViewAlreadyRead({ handleClose, handleSetFeed, userRemote }) {
  const handleClick = async () => {
    handleClose();

    handleSetFeed(userRemote, undefined /* query */, true /* all items */);
  };

  return (
    <MenuItem onClick={handleClick}>
      <F msg="view all items" />
    </MenuItem>
  );
}
