import DataLoader from 'dataloader';
import groupBy from 'lodash/groupBy';
import prisma from './prisma';
import type { User } from '../generated/prisma/client';

export type Loaders = {
  users: DataLoader<number, User[] | undefined>;
};

export default function createLoaders(): Loaders {
  return {
    users: new DataLoader(loadUsers),
  };
}

async function loadUsers(userIds: readonly number[]) {
  const users = await prisma.user.findMany({ where: { id: { in: userIds.slice() } } });
  const userById = groupBy(users, 'id');
  return userIds.map((userId) => userById[userId]);
}
