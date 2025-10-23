"use client";

import { useEffect, useState } from "react";
import { Activity, Brain, Heart, Plus, TrendingUp, AlertTriangle } from "lucide-react";
import { DailyAssessment } from "@/lib/storage";
import { useHealthStorage } from "@/lib/useHealthStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";
import UserInfo from "@/components/UserInfo";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

const LoadingSkeleton = () => (
  <>
    {/* User Info Skeleton */}
    <div className="mb-8 p-4 rounded-xl bg-white/50 backdrop-blur-sm shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-blue-200 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-36 bg-blue-200 rounded-lg animate-pulse" />
            <div className="h-4 w-28 bg-blue-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-28 bg-blue-200 rounded-lg animate-pulse" />
      </div>
    </div>

    {/* Today's Status Skeleton */}
    <Card className="mb-8 overflow-hidden bg-gradient-to-br from-blue-500/50 to-blue-600/50 border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg animate-pulse" />
          <div className="h-8 w-40 bg-white/20 rounded-lg animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
            <div className="h-10 w-44 bg-white/20 rounded-lg animate-pulse" />
          </div>
          <div className="w-24 h-24 bg-white/20 rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>

    {/* Weekly Stats Skeleton */}
    <div className="grid grid-cols-2 gap-6 mb-8">
      {[
        'from-indigo-500/50 to-blue-600/50',
        'from-emerald-500/50 to-green-600/50',
        'from-violet-500/50 to-purple-600/50',
        'from-rose-500/50 to-red-600/50'
      ].map((gradient, i) => (
        <div key={i} className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-lg`}>
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full mx-auto animate-pulse" />
            <div className="h-5 w-24 bg-white/20 rounded animate-pulse mx-auto" />
            <div className="h-10 w-16 bg-white/20 rounded-lg animate-pulse mx-auto" />
          </div>
        </div>
      ))}
    </div>
  </>
);

export default function Dashboard() {
  const [todayAssessment, setTodayAssessment] =
    useState<DailyAssessment | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailyAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { logout } = useAuth();
  const {
    getDailyAssessment,
    getRecentAssessments,
    isLoading: isStorageLoading,
  } = useHealthStorage();

  useEffect(() => {
    const loadData = async () => {
      if (isStorageLoading) return;

      setIsLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const [assessment, assessments] = await Promise.all([
          getDailyAssessment(today),
          getRecentAssessments(),
        ]);

        setTodayAssessment(assessment);
        setWeeklyData(assessments.slice(-7));
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [getDailyAssessment, getRecentAssessments, isStorageLoading]);

  const getReadinessColor = (score: number | undefined) => {
    if (!score) return "bg-gray-200";
    if (score >= 40) return "bg-green-500";
    if (score >= 30) return "bg-yellow-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  const stats = {
    avgReadiness:
      weeklyData.length > 0
        ? Math.round(
            weeklyData.reduce(
              (sum, day) =>
                sum + (day.morningAssessment?.exerciseReadinessScore || 0),
              0
            ) / weeklyData.length
          )
        : 0,
    avgEnergy:
      weeklyData.length > 0
        ? Math.round(
            (weeklyData.reduce(
              (sum, day) => sum + (day.morningAssessment?.energyWaking || 0),
              0
            ) /
              weeklyData.length) *
              10
          ) / 10
        : 0,
    avgSleep:
      weeklyData.length > 0
        ? Math.round(
            (weeklyData.reduce(
              (sum, day) => sum + (day.morningAssessment?.sleepQuality || 0),
              0
            ) /
              weeklyData.length) *
              10
          ) / 10
        : 0,
    totalExercise: weeklyData.reduce(
      (sum, day) => sum + (day.exerciseSession ? 1 : 0),
      0
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Page Header with User Info */}
        <div className="mb-8">
          <UserInfo onLogout={logout} />
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : todayAssessment?.morningAssessment?.exerciseReadinessScore ? (
          <>
            {/* Today's Status */}
            <Card className="mb-8 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="text-white" size={24} />
                  <span className="text-xl">Today&apos;s Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 mb-1">Exercise Readiness</p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-4xl font-bold">
                        {todayAssessment.morningAssessment.exerciseReadinessScore}
                      </p>
                      <p className="text-xl text-blue-200">/50</p>
                    </div>
                  </div>
                  <div
                    className={`w-24 h-24 rounded-full flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm border-2 border-white/30`}
                  >
                    <span className="text-3xl font-bold">
                      {Math.round(
                        (todayAssessment.morningAssessment
                          .exerciseReadinessScore /
                          50) *
                          100
                      )}
                    </span>
                    <span className="text-sm text-blue-100">Readiness</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 shadow-lg transform transition-transform hover:scale-105">
                <div className="text-center text-white">
                  <div className="bg-white/20 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-blue-100 mb-1">Avg Readiness</p>
                  <p className="text-3xl font-bold">{stats.avgReadiness}</p>
                  <p className="text-sm text-blue-200">out of 50</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-lg transform transition-transform hover:scale-105">
                <div className="text-center text-white">
                  <div className="bg-white/20 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center backdrop-blur-sm">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-green-100 mb-1">Avg Energy</p>
                  <p className="text-3xl font-bold">{stats.avgEnergy}</p>
                  <p className="text-sm text-green-200">out of 10</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 shadow-lg transform transition-transform hover:scale-105">
                <div className="text-center text-white">
                  <div className="bg-white/20 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center backdrop-blur-sm">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-purple-100 mb-1">Exercise Days</p>
                  <p className="text-3xl font-bold">{stats.totalExercise}</p>
                  <p className="text-sm text-purple-200">out of 7</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-6 shadow-lg transform transition-transform hover:scale-105">
                <div className="text-center text-white">
                  <div className="bg-white/20 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center backdrop-blur-sm">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-red-100 mb-1">Avg Sleep</p>
                  <p className="text-3xl font-bold">{stats.avgSleep}</p>
                  <p className="text-sm text-red-200">hours per night</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <Card className="border-none bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border-2 border-white/30">
                  <AlertTriangle className="text-white" size={40} />
                </div>
                <div className="text-white">
                  <h3 className="text-2xl font-semibold mb-3">
                    Start Your Day Right
                  </h3>
                  <p className="text-blue-100 text-lg mb-4 max-w-md mx-auto">
                    Complete your morning assessment to get personalized exercise
                    recommendations tailored to how you&apos;re feeling today.
                  </p>
                  <p className="text-blue-200 text-sm mb-6 max-w-sm mx-auto">
                    Your readiness score helps us suggest the most appropriate
                    activities to keep you healthy and safe.
                  </p>
                  <Button
                    onClick={() => router.push("/daily")}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold shadow-lg transform transition-transform hover:scale-105"
                  >
                    Complete Morning Assessment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent exercise sessions and other content can go here */}
      </div>

      <BottomNavigation />
    </div>
  );
}
