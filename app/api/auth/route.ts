import { NextRequest, NextResponse } from 'next/server';
import { RedisClientType } from 'redis';
import { getRedisClient } from '@/lib/redis-connection';

interface User {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

interface UserRecord {
  password: string;
  user: User;
}

class RedisAuth {
  private async getClient(): Promise<RedisClientType> {
    return await getRedisClient();
  }

  private async ensureConnection(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      return false;
    }
    
    try {
      await this.getClient();
      return true;
    } catch (error) {
      console.error('Redis auth connection error:', error);
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    return await this.ensureConnection();
  }

  async getUser(username: string): Promise<UserRecord | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const client = await this.getClient();
      const key = `auth:user:${username.toLowerCase()}`;
      const userData = await client.get(key);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Redis getUser error:', error);
      return null;
    }
  }

  async saveUser(username: string, userRecord: UserRecord): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const client = await this.getClient();
      const key = `auth:user:${username.toLowerCase()}`;
      await client.setEx(key, 86400 * 365, JSON.stringify(userRecord)); // 1 year TTL
      return true;
    } catch (error) {
      console.error('Redis saveUser error:', error);
      return false;
    }
  }

  async createSession(userId: string): Promise<string | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const client = await this.getClient();
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionKey = `auth:session:${sessionToken}`;
      await client.setEx(sessionKey, 86400 * 30, userId); // 30 days TTL
      return sessionToken;
    } catch (error) {
      console.error('Redis createSession error:', error);
      return null;
    }
  }

  async getSession(sessionToken: string): Promise<string | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const client = await this.getClient();
      const sessionKey = `auth:session:${sessionToken}`;
      return await client.get(sessionKey);
    } catch (error) {
      console.error('Redis getSession error:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const client = await this.getClient();
      // Search through all users to find the one with matching ID
      // In a production system, you'd want to store a userId -> username mapping
      const pattern = 'auth:user:*';
      const keys = await client.keys(pattern);
      
      const userPromises = keys.map(async (key) => {
        const userData = await client.get(key);
        if (userData) {
          const userRecord: UserRecord = JSON.parse(userData);
          if (userRecord.user.id === userId) {
            return userRecord.user;
          }
        }
        return null;
      });

      const users = await Promise.all(userPromises);
      const matchedUser = users.find(user => user !== null);
      return matchedUser || null;
    } catch (error) {
      console.error('Redis getUserById error:', error);
      return null;
    }
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const client = await this.getClient();
      const sessionKey = `auth:session:${sessionToken}`;
      await client.del(sessionKey);
      return true;
    } catch (error) {
      console.error('Redis deleteSession error:', error);
      return false;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();
    
    const redisAuth = new RedisAuth();
    
    if (!(await redisAuth.isAvailable())) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    switch (action) {
      case 'login': {
        const { username, password } = body;
        
        if (!username || !password) {
          return NextResponse.json({ success: false, error: 'Username and password required' });
        }

        const userRecord = await redisAuth.getUser(username);
        
        if (!userRecord) {
          return NextResponse.json({ success: false, error: 'User not found' });
        }

        if (userRecord.password !== password) {
          return NextResponse.json({ success: false, error: 'Invalid password' });
        }

        const sessionToken = await redisAuth.createSession(userRecord.user.id);
        
        if (!sessionToken) {
          return NextResponse.json({ success: false, error: 'Failed to create session' });
        }

        return NextResponse.json({
          success: true,
          user: userRecord.user,
          sessionToken
        });
      }

      case 'register': {
        const { username, password, name } = body;
        
        if (!username || !password || !name) {
          return NextResponse.json({ success: false, error: 'All fields are required' });
        }

        const existingUser = await redisAuth.getUser(username);
        
        if (existingUser) {
          return NextResponse.json({ success: false, error: 'Username already exists' });
        }

        const newUser: User = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          username: username.toLowerCase(),
          name: name.trim(),
          createdAt: new Date().toISOString()
        };

        const userRecord: UserRecord = {
          password,
          user: newUser
        };

        const saved = await redisAuth.saveUser(username, userRecord);
        
        if (!saved) {
          return NextResponse.json({ success: false, error: 'Failed to create user' });
        }

        const sessionToken = await redisAuth.createSession(newUser.id);
        
        if (!sessionToken) {
          return NextResponse.json({ success: false, error: 'Failed to create session' });
        }

        return NextResponse.json({ 
          success: true, 
          user: newUser, 
          sessionToken 
        });
      }

      case 'verify': {
        const { sessionToken } = body;
        
        if (!sessionToken) {
          return NextResponse.json({ success: false, error: 'Session token required' });
        }

        const userId = await redisAuth.getSession(sessionToken);
        
        if (!userId) {
          return NextResponse.json({ success: false, error: 'Invalid session' });
        }

        const user = await redisAuth.getUserById(userId);
        
        if (!user) {
          return NextResponse.json({ success: false, error: 'User not found' });
        }

        return NextResponse.json({
          success: true,
          user,
          sessionToken
        });
      }

      case 'logout': {
        const { sessionToken } = body;
        
        if (!sessionToken) {
          return NextResponse.json({ success: false, error: 'Session token required' });
        }

        await redisAuth.deleteSession(sessionToken);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('x-session-token');
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token provided' }, { status: 401 });
    }

    const redisAuth = new RedisAuth();
    const userId = await redisAuth.getSession(sessionToken);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await redisAuth.getUserById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}