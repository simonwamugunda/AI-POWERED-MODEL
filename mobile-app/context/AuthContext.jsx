import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuth } from '../services/auth';

const AuthContext = createContext({ user: null, loading: true, configurationError: null });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true, configurationError: null });

  useEffect(() => {
    try {
      return subscribeToAuth((user) => setState({ user, loading: false, configurationError: null }));
    } catch (error) {
      setState({ user: null, loading: false, configurationError: error.message });
    }
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
