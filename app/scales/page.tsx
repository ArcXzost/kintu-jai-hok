'use client';

import { useState, useEffect } from 'react';
import { Save, FileText, TrendingUp } from 'lucide-react';
import { useHealthStorage } from '@/lib/useHealthStorage';
import { FatigueScale } from '@/lib/storage';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNavigation from '@/components/BottomNavigation';

const fssQuestions = [
  "My motivation is lower when I am fatigued",
  "Exercise brings on my fatigue",
  "I am easily fatigued",
  "Fatigue interferes with my physical functioning",
  "Fatigue causes frequent problems for me",
  "My fatigue prevents sustained physical functioning",
  "Fatigue interferes with carrying out certain duties and responsibilities",
  "Fatigue is among my three most disabling symptoms",
  "Fatigue interferes with my work, family, or social life"
];

const facitQuestions = [
  { text: "I feel fatigued", reverse: false },
  { text: "I feel weak all over", reverse: false },
  { text: "I feel listless (washed out)", reverse: false },
  { text: "I feel tired", reverse: false },
  { text: "I have trouble starting things because I am tired", reverse: false },
  { text: "I have trouble finishing things because I am tired", reverse: false },
  { text: "I have energy", reverse: true },
  { text: "I am able to do my usual activities", reverse: true },
  { text: "I need to sleep during the day", reverse: false },
  { text: "I am too tired to eat", reverse: false },
  { text: "I need help doing my usual activities", reverse: false },
  { text: "I am frustrated by being too tired to do the things I want to do", reverse: false },
  { text: "I have to limit my social activity because I am tired", reverse: false }
];

export default function FatigueScales() {
  const { 
    saveFatigueScale, 
    getFatigueScales, 
    isRedisAvailable, 
    isLoading,
    storageStatus 
  } = useHealthStorage();
  
  const [activeTab, setActiveTab] = useState('fss');
  const [fssScores, setFssScores] = useState<number[]>(new Array(9).fill(1));
  const [facitScores, setFacitScores] = useState<number[]>(new Array(13).fill(0));
  const [recentScales, setRecentScales] = useState<FatigueScale[]>([]);
  const [submittedToday, setSubmittedToday] = useState<{ fss: boolean; facit: boolean }>({ fss: false, facit: false });

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadScales = async () => {
      if (isLoading) return;

      setPageLoading(true);
      try {
        const scales = await getFatigueScales();
        
        // Sort scales by date, most recent first
        const sortedScales = scales.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setRecentScales(sortedScales.slice(0, 10));

        // Check if scales were submitted today
        const today = new Date().toISOString().split('T')[0];
        const todayScales = sortedScales.filter(scale => scale.date === today);
        
        setSubmittedToday({
          fss: todayScales.some(scale => scale.type === 'FSS'),
          facit: todayScales.some(scale => scale.type === 'FACIT-F')
        });

        // Load most recent scale scores if available
        const lastFSS = sortedScales.find(scale => scale.type === 'FSS');
        const lastFACIT = sortedScales.find(scale => scale.type === 'FACIT-F');

        if (lastFSS && !submittedToday.fss) {
          setFssScores(lastFSS.scores);
        }
        if (lastFACIT && !submittedToday.facit) {
          setFacitScores(lastFACIT.scores);
        }
      } catch (error) {
        console.error('Failed to load fatigue scales:', error);
      } finally {
        setPageLoading(false);
      }
    };

    loadScales();
  }, [getFatigueScales, isLoading, submittedToday.fss, submittedToday.facit]);

  const calculateFSS = (scores: number[]) => {
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = total / scores.length;
    
    let interpretation = '';
    if (average >= 5.5) interpretation = 'Severe fatigue';
    else if (average >= 4.5) interpretation = 'Significant fatigue';
    else if (average >= 3.5) interpretation = 'Moderate fatigue';
    else interpretation = 'Minimal fatigue';

    return { total: average, interpretation };
  };

  const calculateFACIT = (scores: number[]) => {
    let total = 0;
    scores.forEach((score, index) => {
      if (facitQuestions[index].reverse) {
        total += score; // Positive items: higher score = better (less fatigue)
      } else {
        total += (4 - score); // Negative items: reverse score (higher = less fatigue)
      }
    });

    let interpretation = '';
    if (total >= 40) interpretation = 'Minimal fatigue';
    else if (total >= 30) interpretation = 'Mild fatigue';
    else if (total >= 20) interpretation = 'Moderate fatigue';
    else interpretation = 'Severe fatigue';

    return { total, interpretation };
  };

  const saveFSS = async () => {
    if (submittedToday.fss) {
      alert('FSS assessment already submitted today.');
      return;
    }

    const result = calculateFSS(fssScores);
    const scale: FatigueScale = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'FSS',
      scores: fssScores,
      totalScore: result.total,
      interpretation: result.interpretation
    };

    try {
      await saveFatigueScale(scale);
      setRecentScales(prev => [...prev, scale].slice(-10));
      setSubmittedToday(prev => ({ ...prev, fss: true }));
      alert('FSS assessment saved!' + (isRedisAvailable ? ' (Synced to cloud)' : ' (Saved locally)'));
    } catch (error) {
      alert('Error saving FSS assessment. Please try again.');
    }
  };

  const saveFACIT = async () => {
    if (submittedToday.facit) {
      alert('FACIT-F assessment already submitted today.');
      return;
    }

    const result = calculateFACIT(facitScores);
    const scale: FatigueScale = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'FACIT-F',
      scores: facitScores,
      totalScore: result.total,
      interpretation: result.interpretation
    };

    try {
      await saveFatigueScale(scale);
      setRecentScales(prev => [...prev, scale].slice(-10));
      setSubmittedToday(prev => ({ ...prev, facit: true }));
      alert('FACIT-F assessment saved!' + (isRedisAvailable ? ' (Synced to cloud)' : ' (Saved locally)'));
    } catch (error) {
      alert('Error saving FACIT-F assessment. Please try again.');
    }
  };

  const fssResult = calculateFSS(fssScores);
  const facitResult = calculateFACIT(facitScores);

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Fatigue Assessment Scales</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="fss">FSS</TabsTrigger>
            <TabsTrigger value="facit">FACIT-F</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="fss" className="space-y-6">
            <Card className="border-none shadow-lg backdrop-blur-sm bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <FileText className="text-blue-600" size={20} />
                  <span>Fatigue Severity Scale (FSS)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-gray-600">
                  Rate each statement from 1 (strongly disagree) to 7 (strongly agree) based on how you've felt over the past week.
                </p>

                {fssQuestions.map((question, index) => (
                  <div key={index} className="space-y-3">
                    <p className="text-sm font-medium text-gray-800">
                      {index + 1}. {question}
                    </p>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                        <button
                          key={value}
                          onClick={() => {
                            const newScores = [...fssScores];
                            newScores[index] = value;
                            setFssScores(newScores);
                          }}
                          className={`flex-1 h-10 rounded-lg border-2 transition-colors ${
                            fssScores[index] === value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg border-none text-white">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Average Score:</span>
                    <span className="text-3xl font-bold">
                      {fssResult.total.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-blue-100 mt-2">{fssResult.interpretation}</p>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={saveFSS} 
                    className="w-full h-12"
                    disabled={submittedToday.fss}
                  >
                    {submittedToday.fss ? (
                      <>
                        <FileText size={20} className="mr-2" />
                        Already Submitted Today
                      </>
                    ) : (
                      <>
                        <Save size={20} className="mr-2" />
                        Save FSS Assessment
                      </>
                    )}
                  </Button>
                  {submittedToday.fss && (
                    <p className="text-sm text-center text-gray-500">
                      You can submit another FSS assessment tomorrow
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="text-green-600" size={20} />
                  <span>FACIT-Fatigue Scale</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-gray-600">
                  Rate each item from 0 (not at all) to 4 (very much) based on how you've felt over the past 7 days.
                </p>

                {facitQuestions.map((question, index) => (
                  <div key={index} className="space-y-3">
                    <p className="text-sm font-medium text-gray-800">
                      {index + 1}. {question.text}
                    </p>
                    <div className="flex space-x-2">
                      {[0, 1, 2, 3, 4].map((value) => (
                        <button
                          key={value}
                          onClick={() => {
                            const newScores = [...facitScores];
                            newScores[index] = value;
                            setFacitScores(newScores);
                          }}
                          className={`flex-1 h-10 rounded-lg border-2 transition-colors ${
                            facitScores[index] === value
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Not at all</span>
                      <span>Very much</span>
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-900">Total Score:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {facitResult.total}/52
                    </span>
                  </div>
                  <p className="text-green-800 mt-2">{facitResult.interpretation}</p>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={saveFACIT} 
                    variant="secondary"
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:text-gray-300 disabled:cursor-not-allowed"
                    disabled={submittedToday.facit}
                  >
                    {submittedToday.facit ? (
                      <>
                        <FileText size={20} className="mr-2" />
                        Already Submitted Today
                      </>
                    ) : (
                      <>
                        <Save size={20} className="mr-2" />
                        Save FACIT-F Assessment
                      </>
                    )}
                  </Button>
                  {submittedToday.facit && (
                    <p className="text-sm text-center text-gray-500">
                      You can submit another FACIT-F assessment tomorrow
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="text-purple-600" size={20} />
                  <span>Assessment History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentScales.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No assessments completed yet. Complete an FSS or FACIT-F assessment to see your history.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentScales.map((scale) => (
                      <div key={scale.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{scale.type}</h4>
                            <p className="text-sm text-gray-600">{scale.date}</p>
                            <p className="text-sm text-gray-800 mt-1">{scale.interpretation}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">
                              {scale.type === 'FSS' 
                                ? scale.totalScore.toFixed(1) 
                                : `${scale.totalScore}/52`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}