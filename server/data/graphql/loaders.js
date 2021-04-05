import DataLoader from 'dataloader';
import { User } from '../models';

export default function createLoaders(loaderOptions) {
  const options = { cache: loaderOptions && loaderOptions.disableCache ? false : true };

  return {
    users: new DataLoader(loadUsers, options),
  };
}

// Batch load users
async function loadUsers(userIds) {
  const users = await User.findAll({ where: { id: userIds } });
  const userById = indexBy(users, 'id');
  return userIds.map((userId) => userById[userId]);
}

function indexBy(array, fieldName) {
  return array.reduce((dict, item) => {
    dict[item[fieldName]] = item;
    return dict;
  }, {});
}
