import { createClient } from 'redis';
import type { 
  DailyAssessment, 
  FatigueScale
} from './storage';

// Types for Redis storage
type Assessment = DailyAssessment;
type ExerciseSession = any; // Will define later
type HealthData = {
  assessments: Assessment[];
  fatigueScales: FatigueScale[];
  exerciseSessions: ExerciseSession[];
};

export class HealthStorageRedis {
  private client: any;
  private isConnected = false;

  constructor() {
    // Initialize Redis client with your URL
    if (typeof window === 'undefined' && process.env.REDIS_URL) {
      this.client = createClient({
        url: process.env.REDIS_URL
      });
      
      this.client.on('error', (err: any) => {
        console.warn('Redis connection error:', err);
        this.isConnected = false;
      });
      
      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
      });
    }
  }

  private async ensureConnection(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      return false; // Redis only works server-side
    }
    
    if (!this.client) {
      return false;
    }

    if (!this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
        return true;
      } catch (error) {
        console.warn('Failed to connect to Redis:', error);
        return false;
      }
    }
    
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return await this.ensureConnection();
  }

  // Assessment methods
  async saveAssessment(assessment: Assessment): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      const key = `assessment:${assessment.date}`;
      await this.client.setEx(key, 86400 * 30, JSON.stringify(assessment)); // 30 days TTL
      
      // Add to assessments list
      await this.client.lPush('assessments', assessment.date);
    } catch (error) {
      console.warn('Failed to save assessment to Redis:', error);
    }
  }

  async getAssessment(date: string): Promise<Assessment | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client.get(`assessment:${date}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to get assessment from Redis:', error);
      return null;
    }
  }

  async getAssessments(): Promise<Assessment[]> {
    if (!(await this.ensureConnection())) return [];
    
    try {
      const dates = await this.client.lRange('assessments', 0, -1);
      const assessments: Assessment[] = [];
      
      for (const date of dates) {
        const assessment = await this.getAssessment(date);
        if (assessment) {
          assessments.push(assessment);
        }
      }
      
      return assessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.warn('Failed to get assessments from Redis:', error);
      return [];
    }
  }

  async deleteAssessment(date: string): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      await this.client.del(`assessment:${date}`);
      await this.client.lRem('assessments', 0, date);
    } catch (error) {
      console.warn('Failed to delete assessment from Redis:', error);
    }
  }

  // Fatigue Scale methods
  async saveFatigueScale(scale: FatigueScale): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      const key = `fatigue_scale:${scale.id}`;
      await this.client.setEx(key, 86400 * 30, JSON.stringify(scale)); // 30 days TTL
      
      // Add to fatigue scales list
      await this.client.lPush('fatigue_scales', scale.id);
    } catch (error) {
      console.warn('Failed to save fatigue scale to Redis:', error);
    }
  }

  async getFatigueScale(id: string): Promise<FatigueScale | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client.get(`fatigue_scale:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to get fatigue scale from Redis:', error);
      return null;
    }
  }

  async getFatigueScales(): Promise<FatigueScale[]> {
    if (!(await this.ensureConnection())) return [];
    
    try {
      const ids = await this.client.lRange('fatigue_scales', 0, -1);
      const scales: FatigueScale[] = [];
      
      for (const id of ids) {
        const scale = await this.getFatigueScale(id);
        if (scale) {
          scales.push(scale);
        }
      }
      
      return scales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.warn('Failed to get fatigue scales from Redis:', error);
      return [];
    }
  }

  async deleteFatigueScale(id: string): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      await this.client.del(`fatigue_scale:${id}`);
      await this.client.lRem('fatigue_scales', 0, id);
    } catch (error) {
      console.warn('Failed to delete fatigue scale from Redis:', error);
    }
  }

  // Exercise Session methods
  async saveExerciseSession(session: ExerciseSession): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      const key = `exercise_session:${session.id}`;
      await this.client.setEx(key, 86400 * 30, JSON.stringify(session)); // 30 days TTL
      
      // Add to exercise sessions list
      await this.client.lPush('exercise_sessions', session.id);
    } catch (error) {
      console.warn('Failed to save exercise session to Redis:', error);
    }
  }

  async getExerciseSession(id: string): Promise<ExerciseSession | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client.get(`exercise_session:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to get exercise session from Redis:', error);
      return null;
    }
  }

  async getExerciseSessions(): Promise<ExerciseSession[]> {
    if (!(await this.ensureConnection())) return [];
    
    try {
      const ids = await this.client.lRange('exercise_sessions', 0, -1);
      const sessions: ExerciseSession[] = [];
      
      for (const id of ids) {
        const session = await this.getExerciseSession(id);
        if (session) {
          sessions.push(session);
        }
      }
      
      return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.warn('Failed to get exercise sessions from Redis:', error);
      return [];
    }
  }

  async deleteExerciseSession(id: string): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      await this.client.del(`exercise_session:${id}`);
      await this.client.lRem('exercise_sessions', 0, id);
    } catch (error) {
      console.warn('Failed to delete exercise session from Redis:', error);
    }
  }

  // Migration methods
  async migrateFromLocalStorage(data: HealthData): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      console.log('Migrating data to Redis...');
      
      // Migrate assessments
      for (const assessment of data.assessments) {
        await this.saveAssessment(assessment);
      }
      
      // Migrate fatigue scales
      for (const scale of data.fatigueScales) {
        await this.saveFatigueScale(scale);
      }
      
      // Migrate exercise sessions
      for (const session of data.exerciseSessions) {
        await this.saveExerciseSession(session);
      }
      
      console.log('Migration to Redis completed');
    } catch (error) {
      console.warn('Failed to migrate data to Redis:', error);
    }
  }

  async getAllData(): Promise<HealthData> {
    return {
      assessments: await this.getAssessments(),
      fatigueScales: await this.getFatigueScales(),
      exerciseSessions: await this.getExerciseSessions()
    };
  }

  async clearAllData(): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      // Get all keys and delete them
      const assessmentIds = await this.client.lRange('assessments', 0, -1);
      const fatigueScaleIds = await this.client.lRange('fatigue_scales', 0, -1);
      const exerciseSessionIds = await this.client.lRange('exercise_sessions', 0, -1);
      
      const keysToDelete = [
        'assessments',
        'fatigue_scales', 
        'exercise_sessions',
        ...assessmentIds.map((id: string) => `assessment:${id}`),
        ...fatigueScaleIds.map((id: string) => `fatigue_scale:${id}`),
        ...exerciseSessionIds.map((id: string) => `exercise_session:${id}`)
      ];
      
      if (keysToDelete.length > 0) {
        await this.client.del(keysToDelete);
      }
    } catch (error) {
      console.warn('Failed to clear Redis data:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        this.isConnected = false;
      } catch (error) {
        console.warn('Failed to disconnect from Redis:', error);
      }
    }
  }
}
