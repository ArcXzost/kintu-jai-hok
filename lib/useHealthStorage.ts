 'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

  // Helper function to create headers with authentication (stable reference)
  const getHeaders = useCallback(() => {
    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('health_app_session_token') : null;
    return {
      'Content-Type': 'application/json',
      'x-user-id': user?.id || 'unknown',
      'Authorization': sessionToken ? `Bearer ${sessionToken}` : ''
    };
  }, [user?.id]);

  // In-flight request de-duplication map
  const inFlight = useRef<Map<string, Promise<any>>>(new Map());

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
  const saveDailyAssessment = useCallback(async (assessment: DailyAssessment): Promise<void> => {
    if (!isRedisAvailable || !user) return;

    try {
      await fetch('/api/redis?action=save&type=assessment', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(assessment)
      });
      // Write-through cache for today's assessment to ensure immediate availability
      try {
        const cacheKey = `assessment-${user.id}-${assessment.date}`;
        const cacheTimeKey = `${cacheKey}-time`;
        sessionStorage.setItem(cacheKey, JSON.stringify(assessment));
        sessionStorage.setItem(cacheTimeKey, Date.now().toString());
      } catch { /* ignore quota errors */ }
    } catch (error) {
      console.error('Failed to save assessment:', error);
    }
  }, [getHeaders, isRedisAvailable, user]);

  const getDailyAssessment = useCallback(async (date: string, opts?: { forceRefresh?: boolean }): Promise<DailyAssessment | null> => {
    if (!isRedisAvailable || !user) return null;

    const cacheKey = `assessment-${user.id}-${date}`;
    const cacheTimeKey = `${cacheKey}-time`;
    const now = Date.now();

    if (!opts?.forceRefresh) {
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
    }

    // In-flight de-duplication for same assessment request
    const flightKey = `get:assessment:${user.id}:${date}` + (opts?.forceRefresh ? ':force' : '');
    const existing = inFlight.current.get(flightKey);
    if (existing) return existing;

    const p = (async () => {
    try {
      const response = await fetch(`/api/redis?action=get&type=assessment&id=${date}`, {
        headers: getHeaders()
      });
      const result = await response.json();
      const data = result.data || null;
      // Update cache only if data exists; avoid caching null
      try {
        if (data) {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          sessionStorage.setItem(cacheTimeKey, now.toString());
        } else {
          sessionStorage.removeItem(cacheKey);
          sessionStorage.removeItem(cacheTimeKey);
        }
      } catch { /* ignore quota errors */ }
      return data;
    } catch (error) {
      return null;
      } finally {
        inFlight.current.delete(flightKey);
      }
    })();
    inFlight.current.set(flightKey, p);
    return p;
  }, [getHeaders, isRedisAvailable, user]);

  const getRecentAssessments = useCallback(async (): Promise<DailyAssessment[]> => {
    if (!isRedisAvailable || !user) return [];

    // Cache list for a short TTL to avoid flooding (2 minutes)
    const cacheKey = `assessments-${user.id}`;
    const cacheTimeKey = `${cacheKey}-time`;
    const now = Date.now();
    try {
      const cached = sessionStorage.getItem(cacheKey);
      const cachedAt = sessionStorage.getItem(cacheTimeKey);
      if (cached && cachedAt && (now - parseInt(cachedAt)) < 2 * 60 * 1000) {
        const parsed = JSON.parse(cached) as DailyAssessment[];
        return parsed
          .sort((a: DailyAssessment, b: DailyAssessment) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 30);
      }
    } catch { /* ignore cache errors */ }

    const flightKey = `get:assessments:${user.id}`;
    const existing = inFlight.current.get(flightKey);
    if (existing) return existing;

    const p = (async () => {
      try {
        const response = await fetch('/api/redis?action=get&type=assessments', {
          headers: getHeaders()
        });
        const result = await response.json();
        const assessments = (result.data || []) as DailyAssessment[];
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(assessments));
          sessionStorage.setItem(cacheTimeKey, now.toString());
        } catch { /* ignore quota errors */ }
        return assessments
          .sort((a: DailyAssessment, b: DailyAssessment) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 30);
      } catch (error) {
        return [];
      } finally {
        inFlight.current.delete(flightKey);
      }
    })();
    inFlight.current.set(flightKey, p);
    return p;
  }, [getHeaders, isRedisAvailable, user]);

  // Fatigue Scale methods
  const saveFatigueScale = useCallback(async (scale: FatigueScale): Promise<void> => {
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
  }, [getHeaders, isRedisAvailable, user]);

  const getFatigueScales = useCallback(async (): Promise<FatigueScale[]> => {
    if (!isRedisAvailable || !user) return [];

    // Short TTL cache (2 minutes) + in-flight de-dupe
    const cacheKey = `fatigue-scales-${user.id}`;
    const cacheTimeKey = `${cacheKey}-time`;
    const now = Date.now();
    try {
      const cached = sessionStorage.getItem(cacheKey);
      const cachedAt = sessionStorage.getItem(cacheTimeKey);
      if (cached && cachedAt && (now - parseInt(cachedAt)) < 2 * 60 * 1000) {
        return JSON.parse(cached) as FatigueScale[];
      }
    } catch { /* ignore */ }

    const flightKey = `get:fatigue-scales:${user.id}`;
    const existing = inFlight.current.get(flightKey);
    if (existing) return existing;

    const p = (async () => {
      try {
        const response = await fetch('/api/redis?action=get&type=fatigue-scales', {
          headers: getHeaders()
        });
        const result = await response.json();
        const data = (result.data || []) as FatigueScale[];
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          sessionStorage.setItem(cacheTimeKey, now.toString());
        } catch { /* ignore */ }
        return data;
      } catch (error) {
        return [];
      } finally {
        inFlight.current.delete(flightKey);
      }
    })();
    inFlight.current.set(flightKey, p);
    return p;
  }, [getHeaders, isRedisAvailable, user]);

  // Exercise Session methods (placeholder)
  const saveExerciseSession = useCallback(async (session: any): Promise<void> => {
    if (!isRedisAvailable || !user) return;

    try {
      await fetch('/api/redis?action=save&type=exercise-session', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(session)
      });
      // Write-through list cache: prepend session
      try {
        const cacheKey = `exercise-sessions-${user.id}`;
        const cacheTimeKey = `${cacheKey}-time`;
        const cached = sessionStorage.getItem(cacheKey);
        const list = cached ? (JSON.parse(cached) as any[]) : [];
        const updated = [session, ...list];
        sessionStorage.setItem(cacheKey, JSON.stringify(updated));
        sessionStorage.setItem(cacheTimeKey, Date.now().toString());
      } catch { /* ignore quota errors */ }
    } catch (error) {
      console.error('Failed to save exercise session:', error);
    }
  }, [getHeaders, isRedisAvailable, user]);

  const getExerciseSessions = useCallback(async (): Promise<any[]> => {
    if (!isRedisAvailable || !user) return [];

    const cacheKey = `exercise-sessions-${user.id}`;
    const cacheTimeKey = `${cacheKey}-time`;
    const now = Date.now();
    try {
      const cached = sessionStorage.getItem(cacheKey);
      const cachedAt = sessionStorage.getItem(cacheTimeKey);
      if (cached && cachedAt && (now - parseInt(cachedAt)) < 2 * 60 * 1000) {
        return JSON.parse(cached) as any[];
      }
    } catch { /* ignore */ }

    const flightKey = `get:exercise-sessions:${user.id}`;
    const existing = inFlight.current.get(flightKey);
    if (existing) return existing;

    const p = (async () => {
      try {
        const response = await fetch('/api/redis?action=get&type=exercise-sessions', {
          headers: getHeaders()
        });
        const result = await response.json();
        const data = result.data || [];
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          sessionStorage.setItem(cacheTimeKey, now.toString());
        } catch { /* ignore */ }
        return data;
      } catch (error) {
        return [];
      } finally {
        inFlight.current.delete(flightKey);
      }
    })();
    inFlight.current.set(flightKey, p);
    return p;
  }, [getHeaders, isRedisAvailable, user]);

  // Export data
  const exportAllData = useCallback(async (): Promise<string> => {
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
  }, [getHeaders, isRedisAvailable, user]);

  const api = useMemo(() => ({
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
  }), [isRedisAvailable, isLoading, saveDailyAssessment, getDailyAssessment, getRecentAssessments, saveFatigueScale, getFatigueScales, saveExerciseSession, getExerciseSessions, exportAllData]);

  return api;
}
