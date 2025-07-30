'use client';

import { useEffect, useState } from 'react';
import { Download, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { HealthStorage, DailyAssessment, FatigueScale } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BottomNavigation from '@/components/BottomNavigation';

export default function Reports() {
  const [dailyData, setDailyData] = useState<DailyAssessment[]>([]);
  const [fatigueScales, setFatigueScales] = useState<FatigueScale[]>([]);

  useEffect(() => {
    setDailyData(HealthStorage.getDailyAssessments());
    setFatigueScales(HealthStorage.getFatigueScales());
  }, []);

  const exportData = () => {
    const dataStr = HealthStorage.exportData();
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

  const exerciseSessions = last30Days.filter(day => day.exerciseSession).length;
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Readiness</p>
                <p className="text-2xl font-bold text-blue-600">{avgReadinessScore}/50</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Energy</p>
                <p className="text-2xl font-bold text-green-600">{avgEnergyLevel}/10</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Exercise Sessions</p>
                <p className="text-2xl font-bold text-purple-600">{exerciseSessions}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Days Tracked</p>
                <p className="text-2xl font-bold text-orange-600">{last30Days.length}/30</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Energy Trends */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="text-blue-600" size={20} />
              <span>Energy Trends (Last 14 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {last30Days.slice(-14).map((day, index) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(day.morningAssessment?.energyWaking || 0) * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-6">
                      {day.morningAssessment?.energyWaking || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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

        {/* Healthcare Provider Summary */}
        <Card className="mb-20">
          <CardHeader>
            <CardTitle>Healthcare Provider Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Key Metrics (30 Days)</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Average readiness score: {avgReadinessScore}/50</li>
                <li>• Average energy level: {avgEnergyLevel}/10</li>
                <li>• Exercise sessions completed: {exerciseSessions}</li>
                <li>• Days with tracking data: {last30Days.length}/30</li>
                {topSymptoms.length > 0 && (
                  <li>• Most common symptom: {topSymptoms[0][0]} ({topSymptoms[0][1]} days)</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}