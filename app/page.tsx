'use client';

import { useEffect, useState } from 'react';
import { Activity, Brain, Heart, Plus, TrendingUp } from 'lucide-react';
import { DailyAssessment } from '@/lib/storage';
import { useHealthStorage } from '@/lib/useHealthStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BottomNavigation from '@/components/BottomNavigation';
import UserInfo from '@/components/UserInfo';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [todayAssessment, setTodayAssessment] = useState<DailyAssessment | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailyAssessment[]>([]);
  const router = useRouter();
  const { logout } = useAuth();
  const { getDailyAssessment, getRecentAssessments } = useHealthStorage();

  useEffect(() => {
    const loadData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const assessment = await getDailyAssessment(today);
      setTodayAssessment(assessment);

      // Get last 7 days data
      const assessments = await getRecentAssessments();
      const lastWeek = assessments.slice(-7);
      setWeeklyData(lastWeek);
    };

    loadData();
  }, [getDailyAssessment, getRecentAssessments]);

  const getReadinessColor = (score: number | undefined) => {
    if (!score) return 'bg-gray-200';
    if (score >= 40) return 'bg-green-500';
    if (score >= 30) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getReadinessText = (score: number | undefined) => {
    if (!score) return 'Not assessed';
    if (score >= 40) return 'Good to go';
    if (score >= 30) return 'Light exercise OK';
    if (score >= 20) return 'Rest or gentle activity';
    return 'Rest recommended';
  };

  const readinessScore = todayAssessment?.morningAssessment?.exerciseReadinessScore;
  const avgEnergy = weeklyData.length > 0 
    ? Math.round(weeklyData.reduce((sum, day) => sum + (day.morningAssessment?.energyWaking || 0), 0) / weeklyData.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* User Info */}
        <UserInfo onLogout={logout} />

        {/* Today's Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="text-blue-600" size={20} />
              <span>Today's Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Exercise Readiness</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getReadinessText(readinessScore)}
                </p>
                {readinessScore && (
                  <p className="text-sm text-gray-500">Score: {readinessScore}/50</p>
                )}
              </div>
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${getReadinessColor(readinessScore)}`}
              >
                {readinessScore || '?'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button 
            onClick={() => router.push('/daily')}
            className="h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700"
          >
            <Brain size={24} />
            <span>Morning Check</span>
          </Button>
          <Button 
            onClick={() => router.push('/exercise')}
            className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700"
          >
            <Activity size={24} />
            <span>Exercise</span>
          </Button>
        </div>

        {/* Weekly Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="text-green-600" size={20} />
              <span>Weekly Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Energy</span>
                <span className="font-semibold text-lg">{avgEnergy}/10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Days Tracked</span>
                <span className="font-semibold text-lg">{weeklyData.length}/7</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Exercise Sessions</span>
                <span className="font-semibold text-lg">
                  {weeklyData.filter(d => d.exerciseSession).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="text-purple-600" size={20} />
              <span>Quick Add</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push('/daily?section=notes')}
                className="h-12"
              >
                Daily Notes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/daily?section=symptoms')}
                className="h-12"
              >
                Symptoms
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/daily?section=medical')}
                className="h-12"
              >
                Medical Data
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/scales')}
                className="h-12"
              >
                Fatigue Scale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}