'use client';

import { useState, useEffect } from 'react';
import { HealthStorage, DailyAssessment, FatigueScale } from './storage';
import { HealthStorageKV } from './storage-kv';

/**
 * Hybrid Storage Hook
 * Uses KV storage when available, falls back to localStorage
 * Automatically syncs data between both storage methods
 */
export function useHealthStorage() {
  const [isKVAvailable, setIsKVAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMigrated, setHasMigrated] = useState(false);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Check if KV is available
        const kvHealthy = await HealthStorageKV.healthCheck();
        setIsKVAvailable(kvHealthy);

        if (kvHealthy) {
          // Try to migrate from localStorage if this is the first time using KV
          const migrationKey = 'kv_migration_completed';
          const hasAlreadyMigrated = localStorage.getItem(migrationKey);
          
          if (!hasAlreadyMigrated) {
            const migrated = await HealthStorageKV.migrateFromLocalStorage();
            if (migrated) {
              setHasMigrated(true);
              localStorage.setItem(migrationKey, 'true');
              console.log('✅ Successfully migrated data from localStorage to KV');
            }
          }
        }
      } catch (error) {
        console.warn('KV storage not available, using localStorage only');
        setIsKVAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, []);

  const storage = {
    // Daily Assessment Methods
    saveDailyAssessment: async (assessment: DailyAssessment) => {
      if (isKVAvailable) {
        try {
          await HealthStorageKV.saveDailyAssessment(assessment);
          // Also save to localStorage as backup
          HealthStorage.saveDailyAssessment(assessment);
        } catch (error) {
          console.error('KV save failed, using localStorage:', error);
          HealthStorage.saveDailyAssessment(assessment);
        }
      } else {
        HealthStorage.saveDailyAssessment(assessment);
      }
    },

    getDailyAssessment: async (date: string): Promise<DailyAssessment | null> => {
      if (isKVAvailable) {
        try {
          const assessment = await HealthStorageKV.getDailyAssessment(date);
          if (assessment) return assessment;
        } catch (error) {
          console.error('KV get failed, using localStorage:', error);
        }
      }
      return HealthStorage.getDailyAssessment(date);
    },

    getRecentAssessments: async (limit: number = 30): Promise<DailyAssessment[]> => {
      if (isKVAvailable) {
        try {
          return await HealthStorageKV.getRecentAssessments(limit);
        } catch (error) {
          console.error('KV get recent failed, using localStorage:', error);
        }
      }
      // Fallback to localStorage (limited implementation)
      const assessments: DailyAssessment[] = [];
      const today = new Date();
      
      for (let i = 0; i < limit; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const assessment = HealthStorage.getDailyAssessment(dateStr);
        if (assessment) {
          assessments.push(assessment);
        }
      }
      
      return assessments;
    },

    // Fatigue Scale Methods
    saveFatigueScale: async (scale: FatigueScale) => {
      if (isKVAvailable) {
        try {
          await HealthStorageKV.saveFatigueScale(scale);
          // Also save to localStorage as backup
          HealthStorage.saveFatigueScale(scale);
        } catch (error) {
          console.error('KV save fatigue failed, using localStorage:', error);
          HealthStorage.saveFatigueScale(scale);
        }
      } else {
        HealthStorage.saveFatigueScale(scale);
      }
    },

    getFatigueScales: async (): Promise<FatigueScale[]> => {
      if (isKVAvailable) {
        try {
          return await HealthStorageKV.getFatigueScales();
        } catch (error) {
          console.error('KV get fatigue failed, using localStorage:', error);
        }
      }
      return HealthStorage.getFatigueScales();
    },

    // Exercise Session Methods (Enhanced)
    saveExerciseSession: async (sessionData: {
      date: string;
      exercise: string;
      duration: number;
      session: any;
    }) => {
      const exerciseSession = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...sessionData
      };

      if (isKVAvailable) {
        try {
          await HealthStorageKV.saveExerciseSession(exerciseSession);
        } catch (error) {
          console.error('KV save exercise failed, using localStorage:', error);
        }
      }
      
      // Always save to localStorage as well
      const existingSessions = JSON.parse(localStorage.getItem('exerciseSessions') || '[]');
      existingSessions.push(sessionData);
      localStorage.setItem('exerciseSessions', JSON.stringify(existingSessions));
    },

    getExerciseSessions: async () => {
      if (isKVAvailable) {
        try {
          return await HealthStorageKV.getExerciseSessions();
        } catch (error) {
          console.error('KV get exercises failed, using localStorage:', error);
        }
      }
      
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem('exerciseSessions') || '[]');
    },

    // Utility methods
    exportAllData: async () => {
      if (isKVAvailable) {
        try {
          return await HealthStorageKV.exportAllData();
        } catch (error) {
          console.error('KV export failed, using localStorage:', error);
        }
      }
      
      // Fallback export from localStorage
      return {
        assessments: await storage.getRecentAssessments(365),
        fatigueScales: await storage.getFatigueScales(),
        exerciseSessions: await storage.getExerciseSessions()
      };
    }
  };

  return {
    storage,
    isKVAvailable,
    isLoading,
    hasMigrated
  };
}
