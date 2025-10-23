'use client';

import { useEffect, useState } from 'react';
import { Download, BarChart3, TrendingUp, Calendar, Activity } from 'lucide-react';
import { DailyAssessment, FatigueScale } from '@/lib/storage';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useHealthStorage } from '@/lib/useHealthStorage';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BottomNavigation from '@/components/BottomNavigation';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';

export default function Reports() {
  const [dailyData, setDailyData] = useState<DailyAssessment[]>([]);
  const [fatigueScales, setFatigueScales] = useState<FatigueScale[]>([]);
  const [exerciseSessions, setExerciseSessions] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const { getRecentAssessments, getFatigueScales, getExerciseSessions, exportAllData, isLoading: isStorageLoading } = useHealthStorage();

  useEffect(() => {
    const loadData = async () => {
      if (isStorageLoading) return;

      setPageLoading(true);
      try {
        const [assessments, scales, sessions] = await Promise.all([
          getRecentAssessments(),
          getFatigueScales(),
          getExerciseSessions()
        ]);
        setDailyData(assessments);
        setFatigueScales(scales);
        setExerciseSessions(sessions);
      } catch (error) {
        console.error("Failed to load reports data:", error);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [getRecentAssessments, getFatigueScales, getExerciseSessions, isStorageLoading]);

  const exportData = async () => {
    const dataStr = await exportAllData();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thalassemia-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Analytics calculations
  const last30Days = dailyData.slice(-30);
  const avgReadinessScore = last30Days.length > 0 
    ? Math.round(last30Days.reduce((sum, day) => sum + (day.morningAssessment?.exerciseReadinessScore || 0), 0) / last30Days.length)
    : 0;

  const avgEnergyLevel = last30Days.length > 0
    ? Math.round(last30Days.reduce((sum, day) => sum + (day.morningAssessment?.energyWaking || 0), 0) / last30Days.length * 10) / 10
    : 0;

  const exerciseCount = exerciseSessions.filter(s => !!s).length || exerciseSessions.length;

  // Build 30-day timeline with dates and totals
  const daysBack = 30;
  const byDate = new Map<string, { date: string; readiness: number; energy: number; minutes: number }>();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    byDate.set(key, { date: key, readiness: 0, energy: 0, minutes: 0 });
  }
  last30Days.forEach(day => {
    const entry = byDate.get(day.date);
    if (entry) {
      entry.readiness = day.morningAssessment?.exerciseReadinessScore || 0;
      entry.energy = day.morningAssessment?.energyWaking || 0;
    }
  });
  exerciseSessions.forEach(s => {
    const entry = byDate.get(s.date);
    if (entry) {
      entry.minutes += Number(s.duration || 0);
    }
  });
  const timeline = Array.from(byDate.values());
  
  const recentFSS = fatigueScales.filter(s => s.type === 'FSS').slice(-5);
  const recentFACIT = fatigueScales.filter(s => s.type === 'FACIT-F').slice(-5);

  const mostCommonSymptoms = last30Days
    .flatMap(day => day.symptoms || [])
    .reduce((acc, symptom) => {
      acc[symptom] = (acc[symptom] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topSymptoms = Object.entries(mostCommonSymptoms)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (pageLoading || isStorageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

          <Button onClick={exportData} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 shadow-lg transform transition-transform hover:scale-105">
            <div className="text-center text-white">
              <p className="text-blue-100 mb-1">Avg Readiness</p>
              <p className="text-3xl font-bold">{avgReadinessScore}/50</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-lg transform transition-transform hover:scale-105">
            <div className="text-center text-white">
              <p className="text-green-100 mb-1">Avg Energy</p>
              <p className="text-3xl font-bold">{avgEnergyLevel}/10</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 shadow-lg transform transition-transform hover:scale-105">
            <div className="text-center text-white">
              <p className="text-purple-100 mb-1">Exercise Sessions</p>
              <p className="text-3xl font-bold">{exerciseCount}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-6 shadow-lg transform transition-transform hover:scale-105">
            <div className="text-center text-white">
              <p className="text-red-100 mb-1">Days Tracked</p>
              <p className="text-3xl font-bold">{last30Days.length}/30</p>
            </div>
          </div>
        </div>

        {/* Trends: Readiness & Energy (Line) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="text-blue-600" size={20} />
              <span>Readiness & Energy (Last 30 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                readiness: { label: 'Readiness', color: 'hsl(221, 83%, 53%)' },
                energy: { label: 'Energy', color: 'hsl(142, 76%, 36%)' },
              }}
              className="h-64 w-full"
            >
              <LineChart data={timeline} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} minTickGap={24} />
                <YAxis yAxisId="left" domain={[0, 50]} tickCount={6} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tickCount={6} hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line yAxisId="left" type="monotone" dataKey="readiness" stroke="var(--color-readiness)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="energy" stroke="var(--color-energy)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Exercise Minutes (Bar) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="text-green-600" size={20} />
              <span>Exercise Minutes (Last 30 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ minutes: { label: 'Minutes', color: 'hsl(24, 95%, 53%)' } }}
              className="h-64 w-full"
            >
              <BarChart data={timeline} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} minTickGap={24} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="minutes" fill="var(--color-minutes)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Fatigue Scale History */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="text-green-600" size={20} />
              <span>Fatigue Scale Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentFSS.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">FSS Scores</h4>
                <div className="space-y-2">
                  {recentFSS.map((scale) => (
                    <div key={scale.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{scale.date}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{scale.totalScore.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">{scale.interpretation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentFACIT.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">FACIT-F Scores</h4>
                <div className="space-y-2">
                  {recentFACIT.map((scale) => (
                    <div key={scale.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{scale.date}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{scale.totalScore}/52</span>
                        <span className="text-xs text-gray-500">{scale.interpretation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentFSS.length === 0 && recentFACIT.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No fatigue scale assessments completed yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Symptom Patterns */}
        <Card className="mb-20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="text-red-600" size={20} />
              <span>Common Symptoms (Last 30 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSymptoms.length > 0 ? (
              <div className="space-y-3">
                {topSymptoms.map(([symptom, count]) => (
                  <div key={symptom} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{symptom}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...topSymptoms.map(([,c]) => c))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No symptoms recorded in the last 30 days
              </p>
            )}
          </CardContent>
        </Card>

  {/* Provider summary removed per request */}
      </div>

      <BottomNavigation />
    </div>
  );
}