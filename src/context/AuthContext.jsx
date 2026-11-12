import { useEffect, useState } from 'react';
import { AuthContext } from './authState';
import { useFeedback } from './useFeedback';

export function AuthProvider({ children }) {
  const { alert } = useFeedback();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('leo_user')) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const clearExpiredSession = () => {
      const hadSession = Boolean(localStorage.getItem('leo_token') || localStorage.getItem('leo_user'));
      localStorage.removeItem('leo_user');
      localStorage.removeItem('leo_token');
      setUser(null);
      if (hadSession) {
        alert({
          title: 'Access is no longer available',
          message: 'Your session expired or your account access was changed. Sign in again, or contact your shop owner if your account was deactivated.',
        });
      }
    };
    window.addEventListener('leo-auth-expired', clearExpiredSession);
    return () => window.removeEventListener('leo-auth-expired', clearExpiredSession);
  }, [alert]);

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
