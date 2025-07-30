'use client';

import { useState, useEffect } from 'react';
import { HealthStorage, DailyAssessment, FatigueScale } from './storage';

/**
 * Hybrid Storage Hook
 * Uses Redis storage via API when available, falls back to localStorage
 * Automatically syncs data between both storage methods
 */
export function useHealthStorage() {
  const [isRedisAvailable, setIsRedisAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMigrated, setHasMigrated] = useState(false);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Check if Redis is available via API
        const response = await fetch('/api/redis?action=health-check');
        const result = await response.json();
        setIsRedisAvailable(result.healthy || false);

        if (result.healthy) {
          // Try to migrate from localStorage if this is the first time using Redis
          const migrationKey = 'redis_migration_completed';
          const hasAlreadyMigrated = localStorage.getItem(migrationKey);
          
          if (!hasAlreadyMigrated) {
            try {
              const localData = {
                assessments: HealthStorage.getDailyAssessments(),
                fatigueScales: HealthStorage.getFatigueScales(),
                exerciseSessions: [] // HealthStorage doesn't have exercise sessions yet
              };
              
              if (localData.assessments.length > 0 || localData.fatigueScales.length > 0 || localData.exerciseSessions.length > 0) {
                const migrateResponse = await fetch('/api/redis?action=migrate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(localData)
                });
                
                if (migrateResponse.ok) {
                  setHasMigrated(true);
                  localStorage.setItem(migrationKey, 'true');
                  console.log('✅ Successfully migrated data from localStorage to Redis');
                }
              }
            } catch (migrationError) {
              console.warn('Migration failed:', migrationError);
            }
          }
        }
      } catch (error) {
        console.warn('Redis storage not available, using localStorage only');
        setIsRedisAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, []);

  // Assessment methods
  const saveDailyAssessment = async (assessment: DailyAssessment) => {
    try {
      if (isRedisAvailable) {
        const response = await fetch('/api/redis?action=save&type=assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assessment)
        });
        
        if (!response.ok) throw new Error('Redis save failed');
      } else {
        // Fallback to localStorage
        HealthStorage.saveDailyAssessment(assessment);
      }
    } catch (error) {
      console.warn('Failed to save to Redis, using localStorage:', error);
      HealthStorage.saveDailyAssessment(assessment);
    }
  };

  const getDailyAssessment = async (date: string): Promise<DailyAssessment | null> => {
    try {
      if (isRedisAvailable) {
        const response = await fetch(`/api/redis?action=get&type=assessment&id=${encodeURIComponent(date)}`);
        const result = await response.json();
        return result.data;
      } else {
        return HealthStorage.getDailyAssessment(date);
      }
    } catch (error) {
      console.warn('Failed to get from Redis, using localStorage:', error);
      return HealthStorage.getDailyAssessment(date);
    }
  };

  const getRecentAssessments = async (limit: number = 7): Promise<DailyAssessment[]> => {
    try {
      if (isRedisAvailable) {
        const response = await fetch('/api/redis?action=get&type=assessments');
        const result = await response.json();
        return (result.data || []).slice(0, limit);
      } else {
        const assessments = HealthStorage.getDailyAssessments();
        return assessments
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      }
    } catch (error) {
      console.warn('Failed to get from Redis, using localStorage:', error);
      const assessments = HealthStorage.getDailyAssessments();
      return assessments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    }
  };

  // Fatigue Scale methods
  const saveFatigueScale = async (scale: FatigueScale) => {
    try {
      if (isRedisAvailable) {
        const response = await fetch('/api/redis?action=save&type=fatigue-scale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scale)
        });
        
        if (!response.ok) throw new Error('Redis save failed');
      } else {
        // Fallback to localStorage
        HealthStorage.saveFatigueScale(scale);
      }
    } catch (error) {
      console.warn('Failed to save to Redis, using localStorage:', error);
      HealthStorage.saveFatigueScale(scale);
    }
  };

  const getFatigueScales = async (): Promise<FatigueScale[]> => {
    try {
      if (isRedisAvailable) {
        const response = await fetch('/api/redis?action=get&type=fatigue-scales');
        const result = await response.json();
        return result.data || [];
      } else {
        return HealthStorage.getFatigueScales();
      }
    } catch (error) {
      console.warn('Failed to get from Redis, using localStorage:', error);
      return HealthStorage.getFatigueScales();
    }
  };

  // Exercise Session methods (placeholder - not implemented in HealthStorage yet)
  const saveExerciseSession = async (exerciseSession: any) => {
    try {
      if (isRedisAvailable) {
        const response = await fetch('/api/redis?action=save&type=exercise-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exerciseSession)
        });
        
        if (!response.ok) throw new Error('Redis save failed');
      } else {
        // Fallback to localStorage (manual implementation)
        const sessions = JSON.parse(localStorage.getItem('exercise_sessions') || '[]');
        sessions.push(exerciseSession);
        localStorage.setItem('exercise_sessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.warn('Failed to save to Redis, using localStorage:', error);
      const sessions = JSON.parse(localStorage.getItem('exercise_sessions') || '[]');
      sessions.push(exerciseSession);
      localStorage.setItem('exercise_sessions', JSON.stringify(sessions));
    }
  };

  const getExerciseSessions = async (): Promise<any[]> => {
    try {
      if (isRedisAvailable) {
        const response = await fetch('/api/redis?action=get&type=exercise-sessions');
        const result = await response.json();
        return result.data || [];
      } else {
        return JSON.parse(localStorage.getItem('exercise_sessions') || '[]');
      }
    } catch (error) {
      console.warn('Failed to get from Redis, using localStorage:', error);
      return JSON.parse(localStorage.getItem('exercise_sessions') || '[]');
    }
  };

  // Data export
  const exportAllData = async () => {
    try {
      if (isRedisAvailable) {
        const response = await fetch('/api/redis?action=get&type=all');
        const result = await response.json();
        return result.data || { assessments: [], fatigueScales: [], exerciseSessions: [] };
      } else {
        return {
          assessments: HealthStorage.getDailyAssessments(),
          fatigueScales: HealthStorage.getFatigueScales(),
          exerciseSessions: JSON.parse(localStorage.getItem('exercise_sessions') || '[]')
        };
      }
    } catch (error) {
      console.warn('Failed to export from Redis, using localStorage:', error);
      return {
        assessments: HealthStorage.getDailyAssessments(),
        fatigueScales: HealthStorage.getFatigueScales(),
        exerciseSessions: JSON.parse(localStorage.getItem('exercise_sessions') || '[]')
      };
    }
  };

  const getStorageStatus = () => {
    if (isLoading) return 'Loading...';
    return isRedisAvailable ? 'Cloud Sync ✓' : 'Local Storage';
  };

  return {
    // Storage status
    isRedisAvailable,
    isLoading,
    hasMigrated,
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
