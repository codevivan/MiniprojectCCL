import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { updateSocketAuth } from '../services/socket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize user and token synchronously from localStorage so there is zero auth flicker on navigation
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campusbite_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('campusbite_token') || null);
  // If we already have token and user in localStorage, loading is false immediately
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('campusbite_token') && !localStorage.getItem('campusbite_user')));

  const logout = useCallback(() => {
    localStorage.removeItem('campusbite_token');
    localStorage.removeItem('campusbite_user');
    setToken(null);
    setUser(null);
    setLoading(false);
    updateSocketAuth(null);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('campusbite_token', newToken);
    if (newUser) {
      localStorage.setItem('campusbite_user', JSON.stringify(newUser));
    }
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
    updateSocketAuth(newToken);
  }, []);

  // Background token verification & profile refresh
  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (res.success && res.user && isMounted) {
          setUser(res.user);
          localStorage.setItem('campusbite_user', JSON.stringify(res.user));
          updateSocketAuth(token);
        } else if (isMounted) {
          logout();
        }
      } catch (err) {
        console.warn('Session verification notice:', err.message);
        // Only force logout if HTTP 401 Unauthorized (session genuinely expired)
        if (err.status === 401 && isMounted) {
          logout();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  const isStudent = user?.role?.toUpperCase() === 'STUDENT';
  const isOwner = user?.role?.toUpperCase() === 'OWNER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        isStudent,
        isOwner,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
