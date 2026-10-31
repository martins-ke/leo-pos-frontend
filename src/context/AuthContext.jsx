import { useEffect, useState } from 'react';
import { AuthContext } from './authState';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('leo_user')) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const clearExpiredSession = () => {
      localStorage.removeItem('leo_user');
      localStorage.removeItem('leo_token');
      setUser(null);
    };
    window.addEventListener('leo-auth-expired', clearExpiredSession);
    return () => window.removeEventListener('leo-auth-expired', clearExpiredSession);
  }, []);

  const login = (userData) => {
    localStorage.setItem('leo_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('leo_user');
    localStorage.removeItem('leo_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
