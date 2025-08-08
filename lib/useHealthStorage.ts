'use client';

import { useState, useEffect } from 'react';
import { DailyAssessment, FatigueScale } from './storage';
import { useAuth } from './auth';

/**
 * Redis-Only Storage Hook
 * Uses Redis storage via API with authentication
 * Requires user to be logged in
 */
export function useHealthStorage() {
  const [isRedisAvailable, setIsRedisAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Helper function to create headers with authentication
  const getHeaders = () => {
    const sessionToken = localStorage.getItem('health_app_session_token');
    return {
      'Content-Type': 'application/json',
      'x-user-id': user?.id || 'unknown',
      'Authorization': sessionToken ? `Bearer ${sessionToken}` : ''
    };
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializeStorage = async () => {
      if (!user) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        // Check if Redis is available via API with caching
        const cacheKey = `health-check-${user.id}`;
        const cachedResult = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}-time`);
        const now = Date.now();
        
        // Use cached result if less than 30 seconds old
        if (cachedResult && cacheTime && (now - parseInt(cacheTime)) < 30000) {
          if (isMounted) {
            setIsRedisAvailable(cachedResult === 'true');
            setIsLoading(false);
          }
          return;
        }

        const response = await fetch('/api/redis?action=health-check', {
          headers: getHeaders()
        });
        const result = await response.json();
        const isHealthy = result.healthy || false;
        
        // Cache the result
        sessionStorage.setItem(cacheKey, isHealthy.toString());
        sessionStorage.setItem(`${cacheKey}-time`, now.toString());
        
        if (isMounted) {
          setIsRedisAvailable(isHealthy);
        }
      } catch (error) {
        if (isMounted) {
          setIsRedisAvailable(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeStorage();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  const getStorageStatus = () => {
    if (!user) return 'Not authenticated';
    if (isLoading) return 'Initializing...';
    if (isRedisAvailable) return 'Redis storage connected';
    return 'Storage unavailable';
  };

  // Assessment methods
  const saveDailyAssessment = async (assessment: DailyAssessment): Promise<void> => {
    if (!isRedisAvailable || !user) return;

    try {
      await fetch('/api/redis?action=save&type=assessment', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(assessment)
      });
    } catch (error) {
      console.error('Failed to save assessment:', error);
    }
  };

  const getDailyAssessment = async (date: string): Promise<DailyAssessment | null> => {
    if (!isRedisAvailable || !user) return null;

    const cacheKey = `assessment-${user.id}-${date}`;
    const cacheTimeKey = `${cacheKey}-time`;
    const now = Date.now();

    // Try cache first (valid for 10 minutes)
    try {
      const cached = sessionStorage.getItem(cacheKey);
      const cachedAt = sessionStorage.getItem(cacheTimeKey);
      if (cached && cachedAt && (now - parseInt(cachedAt)) < 10 * 60 * 1000) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore cache parse errors
    }

    try {
      const response = await fetch(`/api/redis?action=get&type=assessment&id=${date}`, {
        headers: getHeaders()
      });
      const result = await response.json();
      const data = result.data || null;
      // Update cache
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(cacheTimeKey, now.toString());
      } catch { /* ignore quota errors */ }
      return data;
    } catch (error) {
      return null;
    }
  };

  const getRecentAssessments = async (): Promise<DailyAssessment[]> => {
    if (!isRedisAvailable || !user) return [];

    try {
      const response = await fetch('/api/redis?action=get&type=assessments', {
        headers: getHeaders()
      });
      const result = await response.json();
      const assessments = result.data || [];
      return assessments
        .sort((a: DailyAssessment, b: DailyAssessment) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30); // Last 30 days
    } catch (error) {
      return [];
    }
  };

  // Fatigue Scale methods
  const saveFatigueScale = async (scale: FatigueScale): Promise<void> => {
    if (!isRedisAvailable || !user) return;

    try {
      await fetch('/api/redis?action=save&type=fatigue-scale', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(scale)
      });
    } catch (error) {
      console.error('Failed to save fatigue scale:', error);
    }
  };

  const getFatigueScales = async (): Promise<FatigueScale[]> => {
    if (!isRedisAvailable || !user) return [];

    try {
      const response = await fetch('/api/redis?action=get&type=fatigue-scales', {
        headers: getHeaders()
      });
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      return [];
    }
  };

  // Exercise Session methods (placeholder)
  const saveExerciseSession = async (session: any): Promise<void> => {
    if (!isRedisAvailable || !user) return;

    try {
      await fetch('/api/redis?action=save&type=exercise-session', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(session)
      });
    } catch (error) {
      console.error('Failed to save exercise session:', error);
    }
  };

  const getExerciseSessions = async (): Promise<any[]> => {
    if (!isRedisAvailable || !user) return [];

    try {
      const response = await fetch('/api/redis?action=get&type=exercise-sessions', {
        headers: getHeaders()
      });
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      return [];
    }
  };

  // Export data
  const exportAllData = async (): Promise<string> => {
    if (!isRedisAvailable || !user) return JSON.stringify({ error: 'No data available' });

    try {
      const response = await fetch('/api/redis?action=get&type=all', {
        headers: getHeaders()
      });
      const result = await response.json();
      return JSON.stringify({
        ...result.data,
        exportDate: new Date().toISOString(),
        user: user.username
      }, null, 2);
    } catch (error) {
      return JSON.stringify({ error: 'Export failed' });
    }
  };

  return {
    // Storage status
    isRedisAvailable,
    isLoading,
    storageStatus: getStorageStatus(),
    
    // Assessment methods
    saveDailyAssessment,
    getDailyAssessment,
    getRecentAssessments,
    
    // Fatigue Scale methods
    saveFatigueScale,
    getFatigueScales,
    
    // Exercise Session methods
    saveExerciseSession,
    getExerciseSessions,
    
    // Data management
    exportAllData
  };
}
