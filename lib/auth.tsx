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
      
      // Use cached user if less than 5 minutes old
      if (cachedUser && cacheTime && (now - parseInt(cacheTime)) < 300000) {
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
        // Cache the user data
        sessionStorage.setItem('auth_user_cache', JSON.stringify(result.user));
        sessionStorage.setItem('auth_user_cache_time', Date.now().toString());
      } else {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        sessionStorage.removeItem('auth_user_cache');
        sessionStorage.removeItem('auth_user_cache_time');
      }
    } catch (error) {
      localStorage.removeItem(SESSION_TOKEN_KEY);
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
