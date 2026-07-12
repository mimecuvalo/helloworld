import { createContext, useContext, type ReactNode } from 'react';

export type CurrentUser = { username: string } | null;

const UserContext = createContext<CurrentUser>(null);

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
