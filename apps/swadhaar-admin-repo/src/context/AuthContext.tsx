import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { login, logout } from '../services/LoginService';

interface AuthContextType {
  user: any;
  loading: boolean;
  loginFun: (username: string, password?: string) => Promise<any>;
  logoutFun: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  // Default no-op implementations used outside of AuthProvider
  loginFun: () => Promise.resolve(undefined),
  logoutFun: () => Promise.resolve(),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const token = localStorage.getItem('token');
          setUser(token ? { token } : null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const loginFun = useCallback(async (username: string, password?: string) => {
    const data = await login({ username, password });
    if (data?.result?.access_token) {
      localStorage.setItem('token', data.result.access_token);
      if (data.result.refresh_token) {
        localStorage.setItem('refreshToken', data.result.refresh_token);
      }
      setUser(data.result);
    }
    return data;
  }, []);

  const logoutFun = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || '';
      if (refreshToken) {
        await logout(refreshToken);
      }
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('adminInfo');
      }
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const contextValue = useMemo(
    () => ({ user, loading, loginFun, logoutFun }),
    [user, loading, loginFun, logoutFun]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
