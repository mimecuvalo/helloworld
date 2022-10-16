import { UserPrivate } from 'data/graphql-generated';
import { createContext } from 'react';

interface ContextState {
  user?: UserPrivate;
}
export default createContext({} as ContextState);
