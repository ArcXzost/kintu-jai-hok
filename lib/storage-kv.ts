import { kv } from '@vercel/kv';

// Import existing types from storage.ts
import { DailyAssessment, FatigueScale } from './storage';

export interface ExerciseSession {
  id: string;
  date: string;
  exercise: string;
  duration: number;
  session: {
    preExercise: {
      time: string;
      lastMeal: number;
      hydration: number;
      baselineRPE: number;
    };
    duringExercise: Array<{
      time: string;
      rpe: number;
      talkTest: boolean;
      symptoms: string[];
    }>;
    postExercise: {
      immediateRPE: number;
      recovery30min: number;
      recovery2hr: number;
      satisfaction: number;
    };
  };
}

/**
 * Vercel KV (Redis) Storage for Health Data
 * Provides persistent, fast storage for the thalassemia tracking app
 */
export class HealthStorageKV {
  // Key prefixes for data organization
  private static readonly ASSESSMENT_PREFIX = 'assessment:';
  private static readonly FATIGUE_PREFIX = 'fatigue:';
  private static readonly EXERCISE_PREFIX = 'exercise:';
  private static readonly USER_PREFIX = 'user:';

  /**
   * Daily Assessment Methods
   */
  static async saveDailyAssessment(assessment: DailyAssessment): Promise<void> {
    try {
      const key = `${this.ASSESSMENT_PREFIX}${assessment.date}`;
      await kv.set(key, assessment);
      
      // Also update user's assessment list for quick retrieval
      await this.addToUserList('assessments', assessment.date);
    } catch (error) {
      console.error('Error saving daily assessment:', error);
      throw new Error('Failed to save daily assessment');
    }
  }

  static async getDailyAssessment(date: string): Promise<DailyAssessment | null> {
    try {
      const key = `${this.ASSESSMENT_PREFIX}${date}`;
      return await kv.get<DailyAssessment>(key);
    } catch (error) {
      console.error('Error getting daily assessment:', error);
      return null;
    }
  }

  static async getRecentAssessments(limit: number = 30): Promise<DailyAssessment[]> {
    try {
      const assessmentDates = await this.getUserList('assessments');
      const recentDates = assessmentDates.slice(-limit).reverse(); // Get most recent first
      
      const assessments: DailyAssessment[] = [];
      for (const date of recentDates) {
        const assessment = await this.getDailyAssessment(date);
        if (assessment) {
          assessments.push(assessment);
        }
      }
      
      return assessments;
    } catch (error) {
      console.error('Error getting recent assessments:', error);
      return [];
    }
  }

  /**
   * Fatigue Scale Methods
   */
  static async saveFatigueScale(scale: FatigueScale): Promise<void> {
    try {
      const key = `${this.FATIGUE_PREFIX}${scale.id}`;
      await kv.set(key, scale);
      
      // Add to user's fatigue scales list
      await this.addToUserList('fatigue_scales', scale.id);
    } catch (error) {
      console.error('Error saving fatigue scale:', error);
      throw new Error('Failed to save fatigue scale');
    }
  }

  static async getFatigueScales(): Promise<FatigueScale[]> {
    try {
      const scaleIds = await this.getUserList('fatigue_scales');
      
      const scales: FatigueScale[] = [];
      for (const id of scaleIds) {
        const key = `${this.FATIGUE_PREFIX}${id}`;
        const scale = await kv.get<FatigueScale>(key);
        if (scale) {
          scales.push(scale);
        }
      }
      
      // Sort by date (most recent first)
      return scales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting fatigue scales:', error);
      return [];
    }
  }

  /**
   * Exercise Session Methods
   */
  static async saveExerciseSession(session: ExerciseSession): Promise<void> {
    try {
      const key = `${this.EXERCISE_PREFIX}${session.id}`;
      await kv.set(key, session);
      
      // Add to user's exercise sessions list
      await this.addToUserList('exercise_sessions', session.id);
    } catch (error) {
      console.error('Error saving exercise session:', error);
      throw new Error('Failed to save exercise session');
    }
  }

  static async getExerciseSessions(): Promise<ExerciseSession[]> {
    try {
      const sessionIds = await this.getUserList('exercise_sessions');
      
      const sessions: ExerciseSession[] = [];
      for (const id of sessionIds) {
        const key = `${this.EXERCISE_PREFIX}${id}`;
        const session = await kv.get<ExerciseSession>(key);
        if (session) {
          sessions.push(session);
        }
      }
      
      // Sort by date (most recent first)
      return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting exercise sessions:', error);
      return [];
    }
  }

  /**
   * Data Export/Import Methods
   */
  static async exportAllData(): Promise<{
    assessments: DailyAssessment[];
    fatigueScales: FatigueScale[];
    exerciseSessions: ExerciseSession[];
  }> {
    try {
      const [assessments, fatigueScales, exerciseSessions] = await Promise.all([
        this.getRecentAssessments(365), // Get up to 1 year of assessments
        this.getFatigueScales(),
        this.getExerciseSessions()
      ]);

      return {
        assessments,
        fatigueScales,
        exerciseSessions
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  static async importData(data: {
    assessments?: DailyAssessment[];
    fatigueScales?: FatigueScale[];
    exerciseSessions?: ExerciseSession[];
  }): Promise<void> {
    try {
      // Import assessments
      if (data.assessments) {
        for (const assessment of data.assessments) {
          await this.saveDailyAssessment(assessment);
        }
      }

      // Import fatigue scales
      if (data.fatigueScales) {
        for (const scale of data.fatigueScales) {
          await this.saveFatigueScale(scale);
        }
      }

      // Import exercise sessions
      if (data.exerciseSessions) {
        for (const session of data.exerciseSessions) {
          await this.saveExerciseSession(session);
        }
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }

  /**
   * Utility Methods
   */
  private static async getUserList(listName: string): Promise<string[]> {
    try {
      const key = `${this.USER_PREFIX}${listName}`;
      const list = await kv.get<string[]>(key);
      return list || [];
    } catch (error) {
      console.error(`Error getting user list ${listName}:`, error);
      return [];
    }
  }

  private static async addToUserList(listName: string, item: string): Promise<void> {
    try {
      const key = `${this.USER_PREFIX}${listName}`;
      const currentList = await this.getUserList(listName);
      
      // Add item if it doesn't exist
      if (!currentList.includes(item)) {
        currentList.push(item);
        await kv.set(key, currentList);
      }
    } catch (error) {
      console.error(`Error adding to user list ${listName}:`, error);
    }
  }

  /**
   * Migration from localStorage
   */
  static async migrateFromLocalStorage(): Promise<boolean> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') return false;

      let migrated = false;

      // Migrate daily assessments
      const assessmentData = localStorage.getItem('thal_daily_assessments');
      if (assessmentData) {
        const assessments: DailyAssessment[] = JSON.parse(assessmentData);
        for (const assessment of assessments) {
          await this.saveDailyAssessment(assessment);
        }
        migrated = true;
      }

      // Migrate fatigue scales
      const fatigueData = localStorage.getItem('thal_fatigue_scales');
      if (fatigueData) {
        const scales: FatigueScale[] = JSON.parse(fatigueData);
        for (const scale of scales) {
          await this.saveFatigueScale(scale);
        }
        migrated = true;
      }

      // Migrate exercise sessions
      const exerciseData = localStorage.getItem('exerciseSessions');
      if (exerciseData) {
        const sessions = JSON.parse(exerciseData);
        for (const sessionData of sessions) {
          const session: ExerciseSession = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: sessionData.date,
            exercise: sessionData.exercise,
            duration: sessionData.duration,
            session: sessionData.session
          };
          await this.saveExerciseSession(session);
        }
        migrated = true;
      }

      return migrated;
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      return false;
    }
  }

  /**
   * Health check method
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await kv.set('health_check', Date.now());
      const result = await kv.get('health_check');
      return result !== null;
    } catch (error) {
      console.error('KV health check failed:', error);
      return false;
    }
  }
}

// Export for backward compatibility
export default HealthStorageKV;
