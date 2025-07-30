'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Square, AlertTriangle, Save } from 'lucide-react';
import { HealthStorage, DailyAssessment } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNavigation from '@/components/BottomNavigation';
import RPEScale from '@/components/RPEScale';
import Slider from '@/components/Slider';

export default function ExerciseTracking() {
  const [activeTab, setActiveTab] = useState('pre');
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

  const [isExercising, setIsExercising] = useState(false);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [currentRPE, setCurrentRPE] = useState(0);
  const [talkTest, setTalkTest] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExercising) {
      interval = setInterval(() => {
        setExerciseTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExercising]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startExercise = () => {
    setIsExercising(true);
    setActiveTab('during');
  };

  const stopExercise = () => {
    setIsExercising(false);
    setActiveTab('post');
  };

  const recordInterval = () => {
    const newEntry = {
      time: formatTime(exerciseTime),
      rpe: currentRPE,
      talkTest: talkTest,
      symptoms: [] // Could add symptom selection
    };

    setExerciseSession(prev => ({
      ...prev,
      duringExercise: [...prev.duringExercise, newEntry]
    }));
  };

  const saveSession = () => {
    const today = new Date().toISOString().split('T')[0];
    const existing = HealthStorage.getDailyAssessment(today) || { date: today };
    
    const updated: DailyAssessment = {
      ...existing,
      exerciseSession: exerciseSession
    };

    HealthStorage.saveDailyAssessment(updated);
    alert('Exercise session saved!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Exercise Tracking</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pre">Pre-Exercise</TabsTrigger>
            <TabsTrigger value="during">During</TabsTrigger>
            <TabsTrigger value="post">Post-Exercise</TabsTrigger>
          </TabsList>

          <TabsContent value="pre" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pre-Exercise Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  <RPEScale
                    value={exerciseSession.preExercise.baselineRPE}
                    onChange={(value) => setExerciseSession(prev => ({
                      ...prev,
                      preExercise: { ...prev.preExercise, baselineRPE: value }
                    }))}
                    showWarning={false}
                  />
                </div>

                <Button onClick={startExercise} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                  <Play size={20} className="mr-2" />
                  Start Exercise
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="during" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Exercise Session</span>
                  <span className="text-2xl font-mono text-blue-600">
                    {formatTime(exerciseTime)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isExercising && (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm font-medium">
                        Record your RPE every 5 minutes during exercise
                      </p>
                    </div>

                    <RPEScale
                      value={currentRPE}
                      onChange={setCurrentRPE}
                    />

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Talk Test</h4>
                      <div className="flex space-x-4">
                        <Button
                          variant={talkTest ? "default" : "outline"}
                          onClick={() => setTalkTest(true)}
                          className="flex-1"
                        >
                          Can Talk
                        </Button>
                        <Button
                          variant={!talkTest ? "destructive" : "outline"}
                          onClick={() => setTalkTest(false)}
                          className="flex-1"
                        >
                          Cannot Talk
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <Button onClick={recordInterval} className="h-12">
                        Record Current RPE
                      </Button>
                      <Button onClick={stopExercise} variant="destructive" className="h-12">
                        <Square size={20} className="mr-2" />
                        Stop Exercise
                      </Button>
                    </div>
                  </>
                )}

                {!isExercising && exerciseSession.duringExercise.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Click "Start Exercise" in Pre-Exercise tab to begin</p>
                  </div>
                )}

                {exerciseSession.duringExercise.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Exercise Log</h4>
                    {exerciseSession.duringExercise.map((entry, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                        <span className="font-mono">{entry.time}</span>
                        <span className="font-semibold">RPE: {entry.rpe}</span>
                        <span className={`text-sm ${entry.talkTest ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.talkTest ? 'Can talk' : 'Cannot talk'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="post" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post-Exercise Recovery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Immediate RPE (Right After Exercise)</h4>
                  <RPEScale
                    value={exerciseSession.postExercise.immediateRPE}
                    onChange={(value) => setExerciseSession(prev => ({
                      ...prev,
                      postExercise: { ...prev.postExercise, immediateRPE: value }
                    }))}
                    showWarning={false}
                  />
                </div>

                <Slider
                  label="30-Minute Recovery RPE"
                  value={exerciseSession.postExercise.recovery30min}
                  onChange={(value) => setExerciseSession(prev => ({
                    ...prev,
                    postExercise: { ...prev.postExercise, recovery30min: value }
                  }))}
                  min={0}
                  max={10}
                  description="How do you feel 30 minutes after exercise?"
                />

                <Slider
                  label="2-Hour Recovery RPE"
                  value={exerciseSession.postExercise.recovery2hr}
                  onChange={(value) => setExerciseSession(prev => ({
                    ...prev,
                    postExercise: { ...prev.postExercise, recovery2hr: value }
                  }))}
                  min={0}
                  max={10}
                  description="How do you feel 2 hours after exercise?"
                />

                <Slider
                  label="Session Satisfaction"
                  value={exerciseSession.postExercise.satisfaction}
                  onChange={(value) => setExerciseSession(prev => ({
                    ...prev,
                    postExercise: { ...prev.postExercise, satisfaction: value }
                  }))}
                  description="How satisfied are you with this exercise session?"
                />

                <Button onClick={saveSession} className="w-full h-12 text-lg">
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