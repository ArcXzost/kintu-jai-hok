'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage key for Redis session token
const SESSION_TOKEN_KEY = 'health_app_session_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in via session token
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (sessionToken) {
      // First, try to get user from sessionStorage cache
      const cachedUser = sessionStorage.getItem('auth_user_cache');
      const cacheTime = sessionStorage.getItem('auth_user_cache_time');
      const now = Date.now();
      
      // Use cached user if less than 10 minutes old (extended from 5)
      if (cachedUser && cacheTime && (now - parseInt(cacheTime)) < 600000) {
        try {
          const user = JSON.parse(cachedUser);
          setUser(user);
          setIsLoading(false);
          return;
        } catch (error) {
          // Invalid cache, proceed with verification
          sessionStorage.removeItem('auth_user_cache');
          sessionStorage.removeItem('auth_user_cache_time');
        }
      }
      
      // Also cache in localStorage for better persistence across browser sessions
      const localCachedUser = localStorage.getItem('auth_user_local_cache');
      const localCacheTime = localStorage.getItem('auth_user_local_cache_time');
      
      // Use local cached user if less than 1 hour old
      if (localCachedUser && localCacheTime && (now - parseInt(localCacheTime)) < 3600000) {
        try {
          const user = JSON.parse(localCachedUser);
          setUser(user);
          setIsLoading(false);
          // Still verify session in background but don't wait for it
          verifySession(sessionToken).catch(() => {
            // If verification fails, clear cache and redirect
            localStorage.removeItem(SESSION_TOKEN_KEY);
            localStorage.removeItem('auth_user_local_cache');
            localStorage.removeItem('auth_user_local_cache_time');
            setUser(null);
          });
          return;
        } catch (error) {
          localStorage.removeItem('auth_user_local_cache');
          localStorage.removeItem('auth_user_local_cache_time');
        }
      }
      
      verifySession(sessionToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifySession = async (sessionToken: string) => {
    try {
      const response = await fetch('/api/auth?action=verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setUser(result.user);
        // Cache the user data in both session and local storage
        const now = Date.now().toString();
        sessionStorage.setItem('auth_user_cache', JSON.stringify(result.user));
        sessionStorage.setItem('auth_user_cache_time', now);
        localStorage.setItem('auth_user_local_cache', JSON.stringify(result.user));
        localStorage.setItem('auth_user_local_cache_time', now);
      } else {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem('auth_user_local_cache');
        localStorage.removeItem('auth_user_local_cache_time');
        sessionStorage.removeItem('auth_user_cache');
        sessionStorage.removeItem('auth_user_cache_time');
      }
    } catch (error) {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem('auth_user_local_cache');
      localStorage.removeItem('auth_user_local_cache_time');
      sessionStorage.removeItem('auth_user_cache');
      sessionStorage.removeItem('auth_user_cache_time');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      
      if (result.success) {
        setUser(result.user);
        localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
        // Cache user data for faster subsequent loads
        const now = Date.now().toString();
        sessionStorage.setItem('auth_user_cache', JSON.stringify(result.user));
        sessionStorage.setItem('auth_user_cache_time', now);
        localStorage.setItem('auth_user_local_cache', JSON.stringify(result.user));
        localStorage.setItem('auth_user_local_cache_time', now);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (username: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, name }),
      });

      const result = await response.json();
      
      if (result.success) {
        setUser(result.user);
        localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
        // Cache user data for faster subsequent loads
        const now = Date.now().toString();
        sessionStorage.setItem('auth_user_cache', JSON.stringify(result.user));
        sessionStorage.setItem('auth_user_cache_time', now);
        localStorage.setItem('auth_user_local_cache', JSON.stringify(result.user));
        localStorage.setItem('auth_user_local_cache_time', now);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (sessionToken) {
      try {
        await fetch('/api/auth?action=logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken }),
        });
      } catch (error) {
        // Silent error for logout
      }
    }
    
    // Clear all auth-related storage
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem('auth_user_local_cache');
    localStorage.removeItem('auth_user_local_cache_time');
    sessionStorage.removeItem('auth_user_cache');
    sessionStorage.removeItem('auth_user_cache_time');
    
    // Clear health storage caches
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('health-check-')) {
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(`${key}-time`);
      }
    });
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
