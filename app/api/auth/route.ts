import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

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
  private client: any;
  private isConnected = false;

  constructor() {
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
      return false;
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

  async getUser(username: string): Promise<UserRecord | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const key = `auth:user:${username.toLowerCase()}`;
      const userData = await this.client.get(key);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async saveUser(username: string, userRecord: UserRecord): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const key = `auth:user:${username.toLowerCase()}`;
      await this.client.setEx(key, 86400 * 365, JSON.stringify(userRecord)); // 1 year TTL
      return true;
    } catch (error) {
      return false;
    }
  }

  async createSession(userId: string): Promise<string | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionKey = `auth:session:${sessionToken}`;
      await this.client.setEx(sessionKey, 86400 * 30, userId); // 30 days TTL
      return sessionToken;
    } catch (error) {
      return null;
    }
  }

  async getSession(sessionToken: string): Promise<string | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      const sessionKey = `auth:session:${sessionToken}`;
      return await this.client.get(sessionKey);
    } catch (error) {
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    if (!(await this.ensureConnection())) return null;
    
    try {
      // Search through all users to find the one with matching ID
      // In a production system, you'd want to store a userId -> username mapping
      const pattern = 'auth:user:*';
      const keys = await this.client.keys(pattern);
      
      for (const key of keys) {
        const userData = await this.client.get(key);
        if (userData) {
          const userRecord: UserRecord = JSON.parse(userData);
          if (userRecord.user.id === userId) {
            return userRecord.user;
          }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    
    try {
      const sessionKey = `auth:session:${sessionToken}`;
      await this.client.del(sessionKey);
      return true;
    } catch (error) {
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
          return NextResponse.json({ success: false, error: 'All fields required' });
        }

        if (username.length < 3) {
          return NextResponse.json({ success: false, error: 'Username must be at least 3 characters' });
        }

        if (password.length < 4) {
          return NextResponse.json({ success: false, error: 'Password must be at least 4 characters' });
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

        return NextResponse.json({ success: true, user });
      }

      case 'logout': {
        const { sessionToken } = body;
        
        if (sessionToken) {
          await redisAuth.deleteSession(sessionToken);
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    const redisAuth = new RedisAuth();
    
    if (!(await redisAuth.isAvailable())) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    switch (action) {
      case 'verify': {
        if (!sessionToken) {
          return NextResponse.json({ success: false, error: 'Session token required' });
        }

        const userId = await redisAuth.getSession(sessionToken);
        
        if (!userId) {
          return NextResponse.json({ success: false, error: 'Invalid session' });
        }

        return NextResponse.json({ success: true, userId });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
