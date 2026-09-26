import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('maison_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((userData) => {
    localStorage.setItem('maison_token', userData.token);
    const u = { _id: userData._id, name: userData.name, email: userData.email, role: userData.role };
    localStorage.setItem('maison_user', JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('maison_token');
    localStorage.removeItem('maison_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
