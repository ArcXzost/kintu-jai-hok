/**
 * Session Recovery Utilities
 * Handles session persistence across browser refreshes and tab switches
 */

const SESSION_TOKEN_KEY = 'health_app_session_token';
const USER_CACHE_KEY = 'auth_user_local_cache';
const USER_CACHE_TIME_KEY = 'auth_user_local_cache_time';
const SESSION_USER_CACHE_KEY = 'auth_user_cache';
const SESSION_USER_CACHE_TIME_KEY = 'auth_user_cache_time';

export interface User {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

export const SessionRecovery = {
  /**
   * Check if there's a valid session token
   */
  hasValidToken(): boolean {
    return !!localStorage.getItem(SESSION_TOKEN_KEY);
  },

  /**
   * Get session token
   */
  getToken(): string | null {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  },

  /**
   * Store session token
   */
  storeToken(token: string): void {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  },

  /**
   * Get cached user if available and not expired
   */
  getCachedUser(): User | null {
    const now = Date.now();
    
    // Try session storage first (short-term cache)
    const sessionUser = sessionStorage.getItem(SESSION_USER_CACHE_KEY);
    const sessionTime = sessionStorage.getItem(SESSION_USER_CACHE_TIME_KEY);
    
    if (sessionUser && sessionTime) {
      const age = now - parseInt(sessionTime);
      if (age < 600000) { // 10 minutes
        try {
          return JSON.parse(sessionUser);
        } catch {
          sessionStorage.removeItem(SESSION_USER_CACHE_KEY);
          sessionStorage.removeItem(SESSION_USER_CACHE_TIME_KEY);
        }
      }
    }

    // Try localStorage (long-term cache)
    const localUser = localStorage.getItem(USER_CACHE_KEY);
    const localTime = localStorage.getItem(USER_CACHE_TIME_KEY);
    
    if (localUser && localTime) {
      const age = now - parseInt(localTime);
      if (age < 3600000) { // 1 hour
        try {
          return JSON.parse(localUser);
        } catch {
          localStorage.removeItem(USER_CACHE_KEY);
          localStorage.removeItem(USER_CACHE_TIME_KEY);
        }
      }
    }

    return null;
  },

  /**
   * Cache user data
   */
  cacheUser(user: User): void {
    const now = Date.now().toString();
    
    // Store in both session and local storage
    try {
      const userString = JSON.stringify(user);
      
      sessionStorage.setItem(SESSION_USER_CACHE_KEY, userString);
      sessionStorage.setItem(SESSION_USER_CACHE_TIME_KEY, now);
      
      localStorage.setItem(USER_CACHE_KEY, userString);
      localStorage.setItem(USER_CACHE_TIME_KEY, now);
    } catch (error) {
      console.warn('Failed to cache user data:', error);
    }
  },

  /**
   * Clear all session data
   */
  clearSession(): void {
    // Clear token
    localStorage.removeItem(SESSION_TOKEN_KEY);
    
    // Clear user caches
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem(USER_CACHE_TIME_KEY);
    sessionStorage.removeItem(SESSION_USER_CACHE_KEY);
    sessionStorage.removeItem(SESSION_USER_CACHE_TIME_KEY);
    
    // Clear health storage caches
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('health-check-')) {
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(`${key}-time`);
      }
    });
  },

  /**
   * Check if session should be recovered
   * Returns true if we have a token and cached user data
   */
  shouldRecoverSession(): boolean {
    return this.hasValidToken() && this.getCachedUser() !== null;
  },

  /**
   * Prepare for navigation - cache current state
   */
  prepareForNavigation(user: User | null): void {
    if (user) {
      this.cacheUser(user);
    }
  }
};
