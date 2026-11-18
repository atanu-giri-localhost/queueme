import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextInstance.js';
import apiService, { getStoredToken, setStoredToken } from '../services/apiService.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check stored token and hydrate user profile on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadUser() {
      const stored = getStoredToken();
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiService.getMe();
        if (!isCancelled && response?.user) {
          setUser(response.user);
          setToken(stored);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Session expired or invalid token:', err.message);
          setStoredToken(null);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isCancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const res = await apiService.login(email, password);
      setUser(res.user);
      setToken(res.token);
      return { success: true, user: res.user };
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const res = await apiService.register(email, password, name);
      setUser(res.user);
      setToken(res.token);
      return { success: true, user: res.user };
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const res = await apiService.googleAuth(credential);
      setUser(res.user);
      setToken(res.token);
      return { success: true, user: res.user };
    } catch (err) {
      setAuthError(err.message || 'Google sign-in failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiService.logout();
    setUser(null);
    setToken(null);
    setAuthError(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    authError,
    setAuthError,
    login,
    register,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
