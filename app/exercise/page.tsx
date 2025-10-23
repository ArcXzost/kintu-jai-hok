'use client';

import { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import dynamic from 'next/dynamic';
import { Play, AlertTriangle, Save, BookOpen, Heart, Dumbbell, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useHealthStorage } from '@/lib/useHealthStorage';
import { DailyAssessment } from '@/lib/storage';
import { Button, buttonVariants } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import BottomNavigation from '@/components/BottomNavigation';
import type { ExerciseType } from '@/lib/exercises';

// Lazy-load heavier components to reduce initial JS cost
const RPEScale = dynamic(() => import('@/components/RPEScale'), { ssr: false, loading: () => <div className="h-24 rounded bg-gray-100 animate-pulse" /> });
const Slider = dynamic(() => import('@/components/Slider'), { ssr: false, loading: () => <div className="h-8 rounded bg-gray-100 animate-pulse" /> });
const ExerciseGuide = dynamic(() => import('@/components/ExerciseGuide'), { ssr: false, loading: () => (
  <div className="space-y-3">
    <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
    <div className="h-24 w-full bg-white rounded-lg shadow-sm animate-pulse" />
  </div>
) });

export default function ExerciseTracking() {
  const router = useRouter();
  const { 
    saveExerciseSession, 
    getExerciseSessions,
    getDailyAssessment,
    isRedisAvailable, 
    isLoading, 
    storageStatus 
  } = useHealthStorage();
  
  const [activeTab, _setActiveTab] = useState('guide');
  const setActiveTab = (val: string) => startTransition(() => _setActiveTab(val));
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [exerciseSession, setExerciseSession] = useState({
    preExercise: {
      time: new Date().toTimeString().slice(0, 5),
      lastMeal: 2,
      hydration: 5,
      baselineRPE: 0
    },
    duringExercise: [] as Array<{
      time: string;
      rpe: number;
      talkTest: boolean;
      symptoms: string[];
    }>,
    postExercise: {
      immediateRPE: 0,
      recovery30min: 0,
      recovery2hr: 0,
      satisfaction: 5
    }
  });

  const [exerciseTime, setExerciseTime] = useState(30); // duration in minutes
  const [showAllExercises, setShowAllExercises] = useState<string | false>(false);
  const [library, setLibrary] = useState<ExerciseType[] | null>(null);
  const [listReady, setListReady] = useState(false);

  // Get today's readiness score for exercise recommendations
  const [todayReadiness, setTodayReadiness] = useState(0);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [workoutPlanSeed, setWorkoutPlanSeed] = useState(Date.now()); // For regenerating plans
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(true); // Loading state for assessment

  // Load exercise library with minimal defer; if cached in window, reuse instantly
  useEffect(() => {
    let mounted = true;
    const cached = (window as any).__exerciseLibrary as ExerciseType[] | undefined;
    if (cached) {
      setLibrary(cached);
      setListReady(true);
      return () => { mounted = false; };
    }
    import('@/lib/exercises').then(mod => {
      if (mounted) {
        setLibrary(mod.exerciseLibrary);
        (window as any).__exerciseLibrary = mod.exerciseLibrary; // simple runtime cache
        setListReady(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Local helper using the lazily loaded library
  const getExercisesByCategoryLocal = useCallback(
    (category: 'cardio' | 'strength' | 'flexibility') => (library || []).filter(e => e.category === category),
    [library]
  );

  useEffect(() => {
    const loadTodayAssessment = async () => {
      setIsLoadingAssessment(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const assessment = await getDailyAssessment(today);
        if (assessment?.morningAssessment?.exerciseReadinessScore) {
          setTodayReadiness(assessment.morningAssessment.exerciseReadinessScore);
          setHasCompletedAssessment(true);
        } else {
          setHasCompletedAssessment(false);
        }
      } catch (error) {
        console.error('Failed to load assessment:', error);
        setHasCompletedAssessment(false);
      } finally {
        setIsLoadingAssessment(false);
      }
    };

    if (!isLoading) {
      loadTodayAssessment();
    }
  }, [getDailyAssessment, isLoading]);

  const regenerateWorkoutPlan = () => {
    setWorkoutPlanSeed(Date.now());
  };

  const saveSession = async () => {
    // Save the exercise session using hybrid storage
    const today = new Date().toISOString().split('T')[0];
    const sessionData = {
      id: `${today}-${Date.now()}`,
      date: today,
      exercise: selectedExercise?.name || 'Mixed Workout',
      duration: exerciseTime,
      session: exerciseSession
    };
    
    try {
      await saveExerciseSession(sessionData);
      
      // Reset the session
      setExerciseSession({
        preExercise: {
          time: new Date().toTimeString().slice(0, 5),
          lastMeal: 2,
          hydration: 5,
          baselineRPE: 0
        },
        duringExercise: [],
        postExercise: {
          immediateRPE: 0,
          recovery30min: 0,
          recovery2hr: 0,
          satisfaction: 5
        }
      });
  setExerciseTime(30);
      setActiveTab('guide');
      
      alert('Exercise session saved successfully!' + (isRedisAvailable ? ' (Synced to cloud)' : ' (Saved locally)'));
    } catch (error) {
      alert('Error saving session. Please try again.');
    }
  };

  // Removed timer and during-exercise flow for simplicity

  const startExerciseWithGuide = (exercise: ExerciseType) => {
    setSelectedExercise(exercise);
    setActiveTab('pre');
  };

  // Removed during-exercise logging

  const getReadinessRecommendation = (score: number) => {
    const lib = library || [];
    if (score >= 40) return { 
      color: 'text-green-600', 
      bgColor: 'bg-green-50 border-green-200',
      text: 'Excellent! Great day for exercise!', 
      description: 'You can do any exercise with longer durations and moderate intensity.',
      exercises: lib,
      maxDuration: 30,
      icon: '🟢'
    };
    if (score >= 30) return { 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50 border-yellow-200',
      text: 'Good - Light to moderate exercise recommended', 
      description: 'Focus on basic cardio and gentle strength exercises.',
      exercises: lib.filter(e => e.intensity === 'light' || e.intensity === 'moderate'),
      maxDuration: 28,
      icon: '🟡'
    };
    if (score >= 20) return { 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50 border-orange-200',
      text: 'Caution - Gentle activity only', 
      description: 'Stick to flexibility exercises and very light movement.',
      exercises: lib.filter(e => e.category === 'flexibility' || e.intensity === 'light'),
      maxDuration: 25,
      icon: '🟠'
    };
    return { 
      color: 'text-red-600', 
      bgColor: 'bg-red-50 border-red-200',
      text: 'Rest day recommended', 
      description: 'Focus on breathing exercises and complete rest today.',
      exercises: lib.filter(e => e.name.toLowerCase().includes('breathing') || e.category === 'flexibility'),
      maxDuration: 20,
      icon: '🔴'
    };
  };

  // Function to parse duration string to minutes (take middle value for better time allocation)
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)-?(\d+)?\s*min/);
    if (match) {
      const lower = parseInt(match[1]);
      const upper = match[2] ? parseInt(match[2]) : lower;
      return Math.round((lower + upper) / 2); // Take middle value instead of lower bound
    }
    return 15; // Higher default fallback
  };

  // Function to create a balanced workout within time limit - memoized for performance
  const createWorkoutPlan = useCallback((availableExercises: ExerciseType[], maxDuration: number, seed: number) => {
    const plan: { exercise: ExerciseType, duration: number }[] = [];
    let remainingTime = maxDuration;
    
    // Seeded random function for consistent randomness
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Shuffle exercises using seeded randomness
    const shuffled = [...availableExercises].sort((a, b) => {
      return seededRandom(seed + a.id.charCodeAt(0)) - seededRandom(seed + b.id.charCodeAt(0));
    });
    
    // Prioritize different categories for balance
    const categories = ['cardio', 'strength', 'flexibility'];
  const selectedByCategory: { [key: string]: ExerciseType[] } = {
      cardio: [],
      strength: [],
      flexibility: []
    };

    // Group shuffled exercises by category
    shuffled.forEach(exercise => {
      if (selectedByCategory[exercise.category].length < 2) { // Max 2 per category for variety
        selectedByCategory[exercise.category].push(exercise);
      }
    });

    // Add exercises with time allocation
    categories.forEach(category => {
      if (remainingTime <= 3) return; // Need at least 3 minutes
      
      const categoryExercises = selectedByCategory[category];
      if (categoryExercises.length > 0) {
        const exercise = categoryExercises[0];
        const baseDuration = parseDuration(exercise.duration);
        // More aggressive time allocation - aim to use most of the remaining time
        const allocatedTime = Math.min(
          baseDuration, 
          Math.max(8, Math.floor(remainingTime * 0.6)) // At least 8 minutes, up to 60% of remaining time
        );
        
        if (allocatedTime >= 5) {
          plan.push({ exercise, duration: allocatedTime });
          remainingTime -= allocatedTime;
        }
      }
    });

    // Fill remaining time with additional exercises if available
    if (remainingTime >= 8) {
      const flexExercises = shuffled.filter(e => 
        e.category === 'flexibility' && 
        !plan.some(p => p.exercise.id === e.id)
      );
      if (flexExercises.length > 0) {
        const exercise = flexExercises[0];
        const allocatedTime = Math.min(remainingTime, parseDuration(exercise.duration));
        if (allocatedTime >= 5) {
          plan.push({ exercise, duration: allocatedTime });
          remainingTime -= allocatedTime;
        }
      }
    }

    // If still time remaining, extend existing exercises
    if (remainingTime >= 5 && plan.length > 0) {
      // Add time to the first exercise (usually cardio)
      const extensionTime = Math.min(remainingTime, 10);
      plan[0].duration += extensionTime;
      remainingTime -= extensionTime;
    }

    return plan;
  }, []);

  // Memoize workout plan generation to prevent expensive recalculations
  const currentWorkoutPlan = useMemo(() => {
    if (!hasCompletedAssessment || !library) return [];
    const recommendation = getReadinessRecommendation(todayReadiness);
    return createWorkoutPlan(recommendation.exercises, recommendation.maxDuration, workoutPlanSeed);
  }, [hasCompletedAssessment, todayReadiness, workoutPlanSeed, createWorkoutPlan, library]);

  if (isLoading || !library) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Exercise Tracking</h1>
          
          {/* Storage Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isRedisAvailable ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-xs text-gray-600">
                {isRedisAvailable ? 'Cloud Sync' : 'Local Only'}
              </span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="guide">Exercise Guide</TabsTrigger>
            <TabsTrigger value="pre">Pre-Exercise</TabsTrigger>
            <TabsTrigger value="post">Post-Exercise</TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="space-y-6">
            {selectedExercise ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => setSelectedExercise(null)}
                    className={cn(buttonVariants({ variant: 'outline' }))}
                  >
                    ← Back to Exercise List
                  </Button>
                </div>
                <ExerciseGuide 
                  exercise={selectedExercise} 
                  onStartExercise={() => startExerciseWithGuide(selectedExercise)}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Morning Assessment Prompt or Readiness Display */}
                {!hasCompletedAssessment ? (
                  <Card className="border-none bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <CardContent className="p-6 text-center">
                      <div className="space-y-4">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border-2 border-white/30">
                          <AlertTriangle className="text-white" size={40} />
                        </div>
                        <div className="text-white">
                          <h3 className="text-2xl font-semibold mb-3">
                            Complete Your Morning Assessment First
                          </h3>
                          <p className="text-blue-100 mb-4 text-lg">
                            To get personalized exercise recommendations that are safe for your current condition, 
                            please complete today's morning assessment first.
                          </p>
                          <p className="text-blue-200 text-sm mb-6">
                            This helps us determine your exercise readiness score and recommend the most appropriate 
                            activities for today based on how you're feeling.
                          </p>
                          <Button 
                            onClick={() => router.push('/daily')}
                            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold shadow-lg transform transition-transform hover:scale-105"
                          >
                            Go to Morning Assessment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Readiness Assessment Results */}
                    <Card className={`${getReadinessRecommendation(todayReadiness).bgColor} border-none shadow-lg backdrop-blur-sm`}>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="text-4xl">{getReadinessRecommendation(todayReadiness).icon}</div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              Today's Exercise Readiness: {todayReadiness}/50
                            </h3>
                            <p className={`text-lg font-medium ${getReadinessRecommendation(todayReadiness).color} mb-2`}>
                              {getReadinessRecommendation(todayReadiness).text}
                            </p>
                            <p className="text-sm text-gray-700">
                              {getReadinessRecommendation(todayReadiness).description}
                            </p>
                          </div>
                          <div className="pt-2">
                            <p className="text-xs text-gray-600">
                              Based on your morning assessment • Recommendations update daily
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Smart Exercise Recommendations */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                          <span>🎯</span>
                          <span>Today's 30-Minute Workout Plan</span>
                        </h3>
                        <Button
                          onClick={regenerateWorkoutPlan}
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs text-gray-800 hover:text-gray-900')}
                        >
                          🎲 New Plan
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Personalized workout based on your readiness score of {todayReadiness}/50 • Click "New Plan" for different exercises
                      </p>

                      {(() => {
                        const recommendation = getReadinessRecommendation(todayReadiness);
                        const workoutPlan = currentWorkoutPlan; // Use memoized plan
                        const totalTime = workoutPlan.reduce((sum, item) => sum + item.duration, 0);

                        if (workoutPlan.length === 0) {
                          return (
                            <Card className="border-amber-200 bg-amber-50">
                              <CardContent className="p-4 text-center">
                                <p className="text-amber-800 font-medium">
                                  🛌 Rest Day Recommended
                                </p>
                                <p className="text-sm text-amber-700 mt-2">
                                  Your body needs rest today. Focus on gentle breathing exercises and complete rest.
                                </p>
                              </CardContent>
                            </Card>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {/* Workout Summary */}
                            <Card className="border-none bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                              <CardContent className="p-4">
                                <div className="grid grid-cols-3 gap-4 text-center text-white">
                                  <div>
                                    <p className="text-2xl font-bold">{totalTime}</p>
                                    <p className="text-xs text-blue-100">Total Minutes</p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold">{workoutPlan.length}</p>
                                    <p className="text-xs text-blue-100">Exercises</p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold">
                                      {new Set(workoutPlan.map(p => p.exercise.category)).size}
                                    </p>
                                    <p className="text-xs text-blue-100">Categories</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Workout Plan */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900">Your Workout Sequence:</h4>
                              {workoutPlan.map((planItem, index) => {
                                const categoryInfo = {
                                  cardio: { icon: Heart, color: 'text-red-500', bgColor: 'bg-red-50' },
                                  strength: { icon: Dumbbell, color: 'text-blue-500', bgColor: 'bg-blue-50' },
                                  flexibility: { icon: Leaf, color: 'text-green-500', bgColor: 'bg-green-50' }
                                };
                                
                                const CategoryIcon = categoryInfo[planItem.exercise.category as keyof typeof categoryInfo].icon;
                                
                                return (
                                  <Card key={`${planItem.exercise.id}-${index}`} className={`border-none shadow-lg ${categoryInfo[planItem.exercise.category as keyof typeof categoryInfo].bgColor}`}>
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-3 mb-2">
                                            <div className="flex items-center space-x-2">
                                              <span className="w-6 h-6 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                                {index + 1}
                                              </span>
                                              <CategoryIcon className={categoryInfo[planItem.exercise.category as keyof typeof categoryInfo].color} size={20} />
                                            </div>
                                            <div>
                                              <h5 className="font-semibold text-gray-900">{planItem.exercise.name}</h5>
                                              <p className="text-sm text-gray-600">{planItem.duration} minutes • RPE {planItem.exercise.targetRPE.join('-')}</p>
                                            </div>
                                          </div>
                                          <p className="text-sm text-gray-700 mb-3">{planItem.exercise.description}</p>
                                          <div className="flex items-center space-x-2">
                                            <Badge className={cn(badgeVariants({ variant: 'secondary' }), 'text-xs text-gray-800')}> 
                                              {planItem.exercise.category}
                                            </Badge>
                                            <Badge className={cn(badgeVariants({ variant: 'outline' }), 'text-xs text-gray-800')}> 
                                              {planItem.exercise.intensity}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="flex flex-col space-y-2 ml-4">
                                          <Button
                                            onClick={() => setSelectedExercise(planItem.exercise)}
                                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs px-2 py-1 text-gray-800 hover:text-gray-900')}
                                          >
                                            <BookOpen size={12} className="mr-1" />
                                            Guide
                                          </Button>
                                          {planItem.exercise.videoUrl && (
                                            <a
                                              href={planItem.exercise.videoUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <Button
                                                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs px-2 py-1 w-full text-gray-800 hover:text-gray-900')}
                                              >
                                                <Play size={12} className="mr-1 text-red-500" />
                                                Video
                                              </Button>
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>

                            {/* Start Workout Button */}
                            <Card className="border-none bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                              <CardContent className="p-4 text-center">
                                <Button
                                  onClick={() => setActiveTab('pre')}
                                  className="bg-white text-green-600 hover:bg-green-50 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg transform transition-transform hover:scale-105"
                                >
                                  🏃‍♀️ Start This Workout
                                </Button>
                                <p className="text-sm text-green-100 mt-2">
                                  This will guide you through pre-exercise preparation
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })()}

                      {/* Browse All Exercises */}
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <BookOpen size={20} />
                          <span>Browse All Exercises</span>
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          View the complete exercise library. Remember to only do exercises appropriate for your current readiness level.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(['cardio', 'strength', 'flexibility'] as const).map(category => {
                            const allCategoryExercises = library ? getExercisesByCategoryLocal(category) : [];
                            const categoryInfo = {
                              cardio: { name: 'All Cardio', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-50 hover:bg-red-100' },
                              strength: { name: 'All Strength', icon: Dumbbell, color: 'text-blue-500', bgColor: 'bg-blue-50 hover:bg-blue-100' },
                              flexibility: { name: 'All Flexibility', icon: Leaf, color: 'text-green-500', bgColor: 'bg-green-50 hover:bg-green-100' }
                            };

                            const CategoryIcon = categoryInfo[category as keyof typeof categoryInfo].icon;

                            return (
                              <Card 
                                key={`all-${category}`} 
                                className={`cursor-pointer transition-colors ${categoryInfo[category as keyof typeof categoryInfo].bgColor}`}
                                onClick={() => setShowAllExercises(category)}
                              >
                                <CardContent className="p-4 text-center">
                                  <CategoryIcon className={`${categoryInfo[category as keyof typeof categoryInfo].color} mx-auto mb-2`} size={32} />
                                  <h4 className="font-medium text-gray-900 mb-1">
                                    {categoryInfo[category as keyof typeof categoryInfo].name}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {library ? allCategoryExercises.length : '…'} exercises
                                  </p>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        {/* Show All Exercises Modal/Section */}
                        {showAllExercises && (
                          <Card className="mt-6">
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <span>All {typeof showAllExercises === 'string' ? showAllExercises.charAt(0).toUpperCase() + showAllExercises.slice(1) : ''} Exercises</span>
                                <Button
                                  onClick={() => setShowAllExercises(false)}
                                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                                >
                                  ✕ Close
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-3">
                                {!library || !listReady ? (
                                  Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-16 w-full bg-gray-100 rounded animate-pulse" />
                                  ))
                                ) : (
                                  typeof showAllExercises === 'string' && getExercisesByCategoryLocal(showAllExercises as 'cardio' | 'strength' | 'flexibility').map((exercise: ExerciseType) => (
                                  <div 
                                    key={exercise.id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div 
                                        onClick={() => setSelectedExercise(exercise)}
                                        className="flex-1 cursor-pointer"
                                      >
                                        <h4 className="font-semibold">{exercise.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                                        <div className="flex items-center space-x-2 mt-2">
                                          <Badge className={cn(badgeVariants({ variant: 'secondary' }), 'text-xs text-gray-800')}>
                                            {exercise.duration}
                                          </Badge>
                                          <Badge className={cn(badgeVariants({ variant: 'outline' }), 'text-xs text-gray-800')}>
                                            RPE {exercise.targetRPE.join('-')}
                                          </Badge>
                                          <Badge className={cn(badgeVariants({ variant: 'outline' }), 'text-xs text-gray-800')}>
                                            {exercise.intensity}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="flex flex-col space-y-1 ml-2">
                                        <BookOpen 
                                          size={16} 
                                          className="text-gray-400 cursor-pointer hover:text-blue-600 transition-colors" 
                                          onClick={() => setSelectedExercise(exercise)}
                                        />
                                        {exercise.videoUrl && (
                                          <a
                                            href={exercise.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Play 
                                              size={16} 
                                              className="text-red-500 cursor-pointer hover:text-red-600 transition-colors" 
                                            />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  ))
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pre" className="space-y-6">
            <Card className="border-none shadow-lg backdrop-blur-sm bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  <span>Pre-Exercise Assessment</span>
                  {selectedExercise && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {selectedExercise.name}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedExercise && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      💡 Tip: Select an exercise from the Exercise Guide tab first for personalized guidance!
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exercise Time
                  </label>
                  <input
                    type="time"
                    value={exerciseSession.preExercise.time}
                    onChange={(e) => setExerciseSession(prev => ({
                      ...prev,
                      preExercise: { ...prev.preExercise, time: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Slider
                  label="Hours Since Last Meal"
                  value={exerciseSession.preExercise.lastMeal}
                  onChange={(value) => setExerciseSession(prev => ({
                    ...prev,
                    preExercise: { ...prev.preExercise, lastMeal: value }
                  }))}
                  min={0}
                  max={8}
                  description="How many hours ago did you last eat?"
                />

                <Slider
                  label="Hydration Level"
                  value={exerciseSession.preExercise.hydration}
                  onChange={(value) => setExerciseSession(prev => ({
                    ...prev,
                    preExercise: { ...prev.preExercise, hydration: value }
                  }))}
                  description="How well hydrated do you feel?"
                />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Baseline RPE</h4>
                  <p className="text-sm text-gray-600">How do you feel right now before starting exercise?</p>
                  <RPEScale
                    value={exerciseSession.preExercise.baselineRPE}
                    onChange={(value) => setExerciseSession(prev => ({
                      ...prev,
                      preExercise: { ...prev.preExercise, baselineRPE: value }
                    }))}
                    showWarning={false}
                    useSlider={true}
                  />
                </div>

                <Button onClick={() => setActiveTab('post')} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                  <Play size={20} className="mr-2" />
                  Continue to Post-Exercise
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* During tab removed */}

          <TabsContent value="post" className="space-y-6">
            <Card className="border-none shadow-lg backdrop-blur-sm bg-white/90">
              <CardHeader>
                <CardTitle className="text-xl">Post-Exercise Recovery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Slider
                  label="Duration (minutes)"
                  value={exerciseTime}
                  onChange={(value) => setExerciseTime(value)}
                  min={0}
                  max={120}
                  description="How long did you exercise today?"
                />

                <div className="space-y-4 mt-6">
                  <h4 className="font-medium text-gray-900">Immediate RPE (Right After Exercise)</h4>
                  <p className="text-sm text-gray-600">How do you feel immediately after finishing exercise?</p>
                  <RPEScale
                    value={exerciseSession.postExercise.immediateRPE}
                    onChange={(value) => setExerciseSession(prev => ({
                      ...prev,
                      postExercise: { ...prev.postExercise, immediateRPE: value }
                    }))}
                    showWarning={false}
                    useSlider={true}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">30-Minute Recovery RPE</h4>
                  <p className="text-sm text-gray-600">How do you feel 30 minutes after exercise?</p>
                  <RPEScale
                    value={exerciseSession.postExercise.recovery30min}
                    onChange={(value) => setExerciseSession(prev => ({
                      ...prev,
                      postExercise: { ...prev.postExercise, recovery30min: value }
                    }))}
                    showWarning={false}
                    useSlider={true}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">2-Hour Recovery RPE</h4>
                  <p className="text-sm text-gray-600">How do you feel 2 hours after exercise?</p>
                  <RPEScale
                    value={exerciseSession.postExercise.recovery2hr}
                    onChange={(value) => setExerciseSession(prev => ({
                      ...prev,
                      postExercise: { ...prev.postExercise, recovery2hr: value }
                    }))}
                    showWarning={false}
                    useSlider={true}
                  />
                </div>

                <Slider
                  label="Session Satisfaction"
                  value={exerciseSession.postExercise.satisfaction}
                  onChange={(value) => setExerciseSession(prev => ({
                    ...prev,
                    postExercise: { ...prev.postExercise, satisfaction: value }
                  }))}
                  description="How satisfied are you with this exercise session?"
                />

                <Button onClick={saveSession} className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg rounded-xl font-semibold transform transition-transform hover:scale-105">
                  <Save size={20} className="mr-2" />
                  Save Exercise Session
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}