import { createContext } from 'react';

interface ContextState {
  user?: User;
}
export default createContext({} as ContextState);
