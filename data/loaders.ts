import DataLoader from 'dataloader';
import groupBy from 'lodash/groupBy';

export default function createLoaders(loaderOptions?: { [key: string]: boolean }) {
  const options = { cache: loaderOptions?.disableCache ? false : true };

  return {
    users: new DataLoader(loadUsers, options),
  };
}

// Batch load users
async function loadUsers(userIds: readonly number[]) {
  const users = await prisma?.user.findMany({ where: { id: { in: userIds.slice(0) } } });
  const userById = groupBy(users, 'id');
  return userIds.map((userId) => userById[userId]);
}
