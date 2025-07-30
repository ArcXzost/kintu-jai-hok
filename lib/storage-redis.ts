import { createClient } from 'redis';
import type { 
  DailyAssessment, 
  FatigueScale
} from './storage';
import { UserManager } from './user';

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
  private userPrefix: string;

  constructor(userId?: string) {
    // Use provided userId or default for server-side calls
    const finalUserId = userId || 'default_user';
    this.userPrefix = `user:${finalUserId}:`;
    
    // Initialize Redis client with your URL
    if (typeof window === 'undefined' && process.env.REDIS_URL) {
      this.client = createClient({
        url: process.env.REDIS_URL
      });
      
      this.client.on('error', (err: any) => {
        this.isConnected = false;
      });
      
      this.client.on('connect', () => {
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
      const key = `${this.userPrefix}assessment:${assessment.date}`;
      await this.client.setEx(key, 86400 * 30, JSON.stringify(assessment)); // 30 days TTL
      
      // Add to user's assessments list
      await this.client.lPush(`${this.userPrefix}assessments`, assessment.date);
    } catch (error) {
      // Silent error - no logging
    }
  }

  async getAssessment(date: string): Promise<Assessment | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client.get(`${this.userPrefix}assessment:${date}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  async getAssessments(): Promise<Assessment[]> {
    if (!(await this.ensureConnection())) return [];
    
    try {
      const dates = await this.client.lRange(`${this.userPrefix}assessments`, 0, -1);
      const assessments: Assessment[] = [];
      
      for (const date of dates) {
        const assessment = await this.getAssessment(date);
        if (assessment) {
          assessments.push(assessment);
        }
      }
      
      return assessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      return [];
    }
  }

  async deleteAssessment(date: string): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      await this.client.del(`${this.userPrefix}assessment:${date}`);
      await this.client.lRem(`${this.userPrefix}assessments`, 0, date);
    } catch (error) {
      // Silent error
    }
  }

  // Fatigue Scale methods
  async saveFatigueScale(scale: FatigueScale): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      const key = `${this.userPrefix}fatigue_scale:${scale.id}`;
      await this.client.setEx(key, 86400 * 30, JSON.stringify(scale)); // 30 days TTL
      
      // Add to user's fatigue scales list
      await this.client.lPush(`${this.userPrefix}fatigue_scales`, scale.id);
    } catch (error) {
      // Silent error
    }
  }

  async getFatigueScale(id: string): Promise<FatigueScale | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client.get(`${this.userPrefix}fatigue_scale:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  async getFatigueScales(): Promise<FatigueScale[]> {
    if (!(await this.ensureConnection())) return [];
    
    try {
      const ids = await this.client.lRange(`${this.userPrefix}fatigue_scales`, 0, -1);
      const scales: FatigueScale[] = [];
      
      for (const id of ids) {
        const scale = await this.getFatigueScale(id);
        if (scale) {
          scales.push(scale);
        }
      }
      
      return scales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      return [];
    }
  }

  async deleteFatigueScale(id: string): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      await this.client.del(`${this.userPrefix}fatigue_scale:${id}`);
      await this.client.lRem(`${this.userPrefix}fatigue_scales`, 0, id);
    } catch (error) {
      // Silent error
    }
  }

  // Exercise Session methods
  async saveExerciseSession(session: ExerciseSession): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      const key = `${this.userPrefix}exercise_session:${session.id}`;
      await this.client.setEx(key, 86400 * 30, JSON.stringify(session)); // 30 days TTL
      
      // Add to user's exercise sessions list
      await this.client.lPush(`${this.userPrefix}exercise_sessions`, session.id);
    } catch (error) {
      // Silent error
    }
  }

  async getExerciseSession(id: string): Promise<ExerciseSession | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const data = await this.client.get(`${this.userPrefix}exercise_session:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  async getExerciseSessions(): Promise<ExerciseSession[]> {
    if (!(await this.ensureConnection())) return [];
    
    try {
      const ids = await this.client.lRange(`${this.userPrefix}exercise_sessions`, 0, -1);
      const sessions: ExerciseSession[] = [];
      
      for (const id of ids) {
        const session = await this.getExerciseSession(id);
        if (session) {
          sessions.push(session);
        }
      }
      
      return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      return [];
    }
  }

  async deleteExerciseSession(id: string): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
      await this.client.del(`${this.userPrefix}exercise_session:${id}`);
      await this.client.lRem(`${this.userPrefix}exercise_sessions`, 0, id);
    } catch (error) {
      // Silent error
    }
  }

  // Migration methods
  async migrateFromLocalStorage(data: HealthData): Promise<void> {
    if (!(await this.ensureConnection())) return;
    
    try {
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
    } catch (error) {
      // Silent error
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
      // Get all user-specific keys and delete them
      const assessmentIds = await this.client.lRange(`${this.userPrefix}assessments`, 0, -1);
      const fatigueScaleIds = await this.client.lRange(`${this.userPrefix}fatigue_scales`, 0, -1);
      const exerciseSessionIds = await this.client.lRange(`${this.userPrefix}exercise_sessions`, 0, -1);
      
      const keysToDelete = [
        `${this.userPrefix}assessments`,
        `${this.userPrefix}fatigue_scales`, 
        `${this.userPrefix}exercise_sessions`,
        ...assessmentIds.map((id: string) => `${this.userPrefix}assessment:${id}`),
        ...fatigueScaleIds.map((id: string) => `${this.userPrefix}fatigue_scale:${id}`),
        ...exerciseSessionIds.map((id: string) => `${this.userPrefix}exercise_session:${id}`)
      ];
      
      if (keysToDelete.length > 0) {
        await this.client.del(keysToDelete);
      }
    } catch (error) {
      // Silent error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        this.isConnected = false;
      } catch (error) {
        // Silent error
      }
    }
  }
}
