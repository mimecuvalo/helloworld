import React from 'react';

const UserContext = React.createContext({
  user: undefined,
  setUser: () => {},
});
export default UserContext;
