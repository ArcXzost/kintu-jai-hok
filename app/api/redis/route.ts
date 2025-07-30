import { NextRequest, NextResponse } from 'next/server';
import { HealthStorageRedis } from '@/lib/storage-redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    
    // Get user ID from header or use default
    const userId = request.headers.get('x-user-id') || 'default_user';
    const redisStorage = new HealthStorageRedis(userId);
    
    if (!(await redisStorage.isAvailable())) {
      return NextResponse.json({ error: 'Redis not available' }, { status: 503 });
    }

    switch (action) {
      case 'get':
        if (type === 'assessment' && id) {
          const assessment = await redisStorage.getAssessment(id);
          return NextResponse.json({ data: assessment });
        } else if (type === 'assessments') {
          const assessments = await redisStorage.getAssessments();
          return NextResponse.json({ data: assessments });
        } else if (type === 'fatigue-scales') {
          const scales = await redisStorage.getFatigueScales();
          return NextResponse.json({ data: scales });
        } else if (type === 'exercise-sessions') {
          const sessions = await redisStorage.getExerciseSessions();
          return NextResponse.json({ data: sessions });
        } else if (type === 'all') {
          const allData = await redisStorage.getAllData();
          return NextResponse.json({ data: allData });
        }
        break;
      
      case 'health-check':
        const isHealthy = await redisStorage.isAvailable();
        return NextResponse.json({ healthy: isHealthy });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const type = searchParams.get('type');
    
    const body = await request.json();
    
    // Get user ID from header or use default
    const userId = request.headers.get('x-user-id') || 'default_user';
    const redisStorage = new HealthStorageRedis(userId);
    
    if (!(await redisStorage.isAvailable())) {
      return NextResponse.json({ error: 'Redis not available' }, { status: 503 });
    }

    switch (action) {
      case 'save':
        if (type === 'assessment') {
          await redisStorage.saveAssessment(body);
          return NextResponse.json({ success: true });
        } else if (type === 'fatigue-scale') {
          await redisStorage.saveFatigueScale(body);
          return NextResponse.json({ success: true });
        } else if (type === 'exercise-session') {
          await redisStorage.saveExerciseSession(body);
          return NextResponse.json({ success: true });
        }
        break;
      
      case 'migrate':
        await redisStorage.migrateFromLocalStorage(body);
        return NextResponse.json({ success: true });
      
      case 'clear':
        await redisStorage.clearAllData();
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    // Get user ID from header or use default
    const userId = request.headers.get('x-user-id') || 'default_user';
    const redisStorage = new HealthStorageRedis(userId);
    
    if (!(await redisStorage.isAvailable())) {
      return NextResponse.json({ error: 'Redis not available' }, { status: 503 });
    }

    switch (type) {
      case 'assessment':
        await redisStorage.deleteAssessment(id);
        return NextResponse.json({ success: true });
      case 'fatigue-scale':
        await redisStorage.deleteFatigueScale(id);
        return NextResponse.json({ success: true });
      case 'exercise-session':
        await redisStorage.deleteExerciseSession(id);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
