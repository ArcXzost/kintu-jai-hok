import type { RedisClientType } from 'redis';
import type { 
  DailyAssessment, 
  FatigueScale
} from './storage';
import { getRedisClient } from './redis-connection';

// Types for Redis storage
type Assessment = DailyAssessment;
type ExerciseSession = any; // Will define later
type HealthData = {
  assessments: Assessment[];
  fatigueScales: FatigueScale[];
  exerciseSessions: ExerciseSession[];
};

export class HealthStorageRedis {
  private userPrefix: string;

  constructor(userId?: string) {
    // Use provided userId or default for server-side calls
    const finalUserId = userId || 'default_user';
    this.userPrefix = `user:${finalUserId}:`;
  }

  private async getClient(): Promise<RedisClientType> {
    return await getRedisClient();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.ping();
      return true;
    } catch (error) {
      console.error('Redis availability check error:', error);
      return false;
    }
  }

  // Assessment methods
  async saveAssessment(assessment: Assessment): Promise<boolean> {
    try {
      const client = await this.getClient();
      const key = `${this.userPrefix}assessment:${assessment.date}`;
      
      // Store assessment with TTL
      await client.setEx(key, 86400 * 30, JSON.stringify(assessment)); // 30 days TTL
      
      // Add to user's assessments list
      await client.lPush(`${this.userPrefix}assessments`, assessment.date);
      return true;
    } catch (error) {
      console.error('Redis saveAssessment error:', error);
      return false;
    }
  }

  async getAssessment(date: string): Promise<Assessment | null> {
    try {
      const client = await this.getClient();
      const data = await client.get(`${this.userPrefix}assessment:${date}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis getAssessment error:', error);
      return null;
    }
  }

  async getAssessments(): Promise<Assessment[]> {
    try {
      const client = await this.getClient();
      const dates = await client.lRange(`${this.userPrefix}assessments`, 0, -1);
      if (!dates?.length) return [];

      // Use Promise.all to fetch all assessments in parallel
      const assessments = await Promise.all(
        dates.map(async (date) => {
          try {
            return await this.getAssessment(date);
          } catch (error) {
            console.error(`Error fetching assessment for date ${date}:`, error);
            return null;
          }
        })
      );
      
      // Filter out nulls and sort by date
      return assessments
        .filter((a): a is Assessment => a !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Redis getAssessments error:', error);
      return [];
    }
  }

  async deleteAssessment(date: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.del(`${this.userPrefix}assessment:${date}`);
      await client.lRem(`${this.userPrefix}assessments`, 0, date);
      return true;
    } catch (error) {
      console.error('Redis deleteAssessment error:', error);
      return false;
    }
  }

  // Fatigue Scale methods
  async saveFatigueScale(scale: FatigueScale): Promise<boolean> {
    try {
      const client = await this.getClient();
      const key = `${this.userPrefix}fatigue_scale:${scale.id}`;
      
      // Store scale with TTL
      await client.setEx(key, 86400 * 30, JSON.stringify(scale)); // 30 days TTL
      
      // Add to user's fatigue scales list
      await client.lPush(`${this.userPrefix}fatigue_scales`, scale.id);
      return true;
    } catch (error) {
      console.error('Redis saveFatigueScale error:', error);
      return false;
    }
  }

  async getFatigueScale(id: string): Promise<FatigueScale | null> {
    try {
      const client = await this.getClient();
      const data = await client.get(`${this.userPrefix}fatigue_scale:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis getFatigueScale error:', error);
      return null;
    }
  }

  async getFatigueScales(): Promise<FatigueScale[]> {
    try {
      const client = await this.getClient();
      const ids = await client.lRange(`${this.userPrefix}fatigue_scales`, 0, -1);
      if (!ids?.length) return [];

      // Use Promise.all to fetch all scales in parallel
      const scales = await Promise.all(
        ids.map(async (id) => {
          try {
            return await this.getFatigueScale(id);
          } catch (error) {
            console.error(`Error fetching fatigue scale ${id}:`, error);
            return null;
          }
        })
      );
      
      // Filter out nulls and sort by date
      return scales
        .filter((s): s is FatigueScale => s !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Redis getFatigueScales error:', error);
      return [];
    }
  }

  async deleteFatigueScale(id: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.del(`${this.userPrefix}fatigue_scale:${id}`);
      await client.lRem(`${this.userPrefix}fatigue_scales`, 0, id);
      return true;
    } catch (error) {
      console.error('Redis deleteFatigueScale error:', error);
      return false;
    }
  }

  // Exercise Session methods
  async saveExerciseSession(session: ExerciseSession): Promise<boolean> {
    try {
      const client = await this.getClient();
      const key = `${this.userPrefix}exercise_session:${session.id}`;
      await client.setEx(key, 86400 * 30, JSON.stringify(session)); // 30 days TTL
      
      // Add to user's exercise sessions list
      await client.lPush(`${this.userPrefix}exercise_sessions`, session.id);
      return true;
    } catch (error) {
      console.error('Redis saveExerciseSession error:', error);
      return false;
    }
  }

  async getExerciseSession(id: string): Promise<ExerciseSession | null> {
    try {
      const client = await this.getClient();
      const data = await client.get(`${this.userPrefix}exercise_session:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis getExerciseSession error:', error);
      return null;
    }
  }

  async getExerciseSessions(): Promise<ExerciseSession[]> {
    try {
      const client = await this.getClient();
      const ids = await client.lRange(`${this.userPrefix}exercise_sessions`, 0, -1);
      const sessions: ExerciseSession[] = [];
      
      for (const id of ids) {
        const session = await this.getExerciseSession(id);
        if (session) {
          sessions.push(session);
        }
      }
      
      return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Redis getExerciseSessions error:', error);
      return [];
    }
  }

  async deleteExerciseSession(id: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.del(`${this.userPrefix}exercise_session:${id}`);
      await client.lRem(`${this.userPrefix}exercise_sessions`, 0, id);
      return true;
    } catch (error) {
      console.error('Redis deleteExerciseSession error:', error);
      return false;
    }
  }

  // Migration methods
  async migrateFromLocalStorage(data: HealthData): Promise<boolean> {
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
      return true;
    } catch (error) {
      console.error('Redis migrateFromLocalStorage error:', error);
      return false;
    }
  }

  async getAllData(): Promise<HealthData> {
    try {
      return {
        assessments: await this.getAssessments(),
        fatigueScales: await this.getFatigueScales(),
        exerciseSessions: await this.getExerciseSessions()
      };
    } catch (error) {
      console.error('Redis getAllData error:', error);
      return {
        assessments: [],
        fatigueScales: [],
        exerciseSessions: []
      };
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      // Get all user-specific keys and delete them
      const assessmentIds = await client.lRange(`${this.userPrefix}assessments`, 0, -1);
      const fatigueScaleIds = await client.lRange(`${this.userPrefix}fatigue_scales`, 0, -1);
      const exerciseSessionIds = await client.lRange(`${this.userPrefix}exercise_sessions`, 0, -1);
      
      const keysToDelete = [
        `${this.userPrefix}assessments`,
        `${this.userPrefix}fatigue_scales`, 
        `${this.userPrefix}exercise_sessions`,
        ...assessmentIds.map((id: string) => `${this.userPrefix}assessment:${id}`),
        ...fatigueScaleIds.map((id: string) => `${this.userPrefix}fatigue_scale:${id}`),
        ...exerciseSessionIds.map((id: string) => `${this.userPrefix}exercise_session:${id}`)
      ];
      
      if (keysToDelete.length > 0) {
        await client.del(keysToDelete);
      }
      return true;
    } catch (error) {
      console.error('Redis clearAllData error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Redis connection is managed by the centralized connection pool
    // No need to manually disconnect here
  }
}
