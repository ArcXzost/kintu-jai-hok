/**
 * User Management System with Authentication Support
 * Handles user identification for data isolation
 */

export class UserManager {
  private static readonly CURRENT_USER_KEY = 'health_app_current_user';
  
  /**
   * Get current user ID from authentication system
   */
  static getUserId(): string {
    if (typeof window === 'undefined') {
      return 'default_user';
    }
    
    try {
      const currentUser = localStorage.getItem(this.CURRENT_USER_KEY);
      if (currentUser) {
        const user = JSON.parse(currentUser);
        return user.id;
      }
    } catch (error) {
      // Invalid user data, clear it
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
    
    // No authenticated user
    return 'anonymous_user';
  }
  
  /**
   * Get current user info
   */
  static getCurrentUser(): { id: string; username: string; name: string } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const currentUser = localStorage.getItem(this.CURRENT_USER_KEY);
      if (currentUser) {
        return JSON.parse(currentUser);
      }
    } catch (error) {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
    
    return null;
  }
  
  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
  
  /**
   * Get user prefix for Redis keys
   */
  static getUserPrefix(): string {
    return `user:${this.getUserId()}:`;
  }
  
  /**
   * Clear user data (logout)
   */
  static clearUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }
}
