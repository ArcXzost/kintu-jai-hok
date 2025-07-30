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
      } else {
        localStorage.removeItem(SESSION_TOKEN_KEY);
      }
    } catch (error) {
      localStorage.removeItem(SESSION_TOKEN_KEY);
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
    
    setUser(null);
    localStorage.removeItem(SESSION_TOKEN_KEY);
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
