'use client';

import { useEffect, useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { useHealthStorage } from '@/lib/useHealthStorage';
import { DailyAssessment } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import BottomNavigation from '@/components/BottomNavigation';
import Slider from '@/components/Slider';

const commonSymptoms = [
  'Fatigue', 'Breathlessness', 'Dizziness', 'Headache', 
  'Weakness', 'Chest pain', 'Palpitations', 'Cold hands/feet'
];

export default function DailyTracking() {
  const { storage, isKVAvailable, isLoading } = useHealthStorage();
  
  const [assessment, setAssessment] = useState<DailyAssessment>({
    date: new Date().toISOString().split('T')[0],
    morningAssessment: {
      sleepQuality: 5,
      energyWaking: 5,
      mentalClarity: 5,
      physicalReadiness: 5,
      motivation: 5,
      exerciseReadinessScore: 25
    },
    dailyNotes: '',
    symptoms: [],
    medicalData: {
      hemoglobin: 0,
      hematocrit: 0,
      bloodPressureSys: 0,
      bloodPressureDia: 0,
      date: new Date().toISOString().split('T')[0]
    }
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadExistingAssessment = async () => {
      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getDailyAssessment(today);
      if (existing) {
        setAssessment(existing);
      }
    };

    if (!isLoading) {
      loadExistingAssessment();
    }
  }, [storage, isLoading]);

  const updateMorningAssessment = (field: string, value: number) => {
    const newMorning = { ...assessment.morningAssessment!, [field]: value };
    const score = newMorning.sleepQuality + newMorning.energyWaking + 
                 newMorning.mentalClarity + newMorning.physicalReadiness + 
                 newMorning.motivation;
    newMorning.exerciseReadinessScore = score;

    setAssessment({
      ...assessment,
      morningAssessment: newMorning
    });
  };

  const updateSymptoms = (symptom: string, checked: boolean) => {
    const symptoms = assessment.symptoms || [];
    if (checked) {
      setAssessment({
        ...assessment,
        symptoms: [...symptoms, symptom]
      });
    } else {
      setAssessment({
        ...assessment,
        symptoms: symptoms.filter(s => s !== symptom)
      });
    }
  };

  const updateMedicalData = (field: string, value: number) => {
    setAssessment({
      ...assessment,
      medicalData: {
        ...assessment.medicalData!,
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    try {
      await storage.saveDailyAssessment(assessment);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Error saving assessment. Please try again.');
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 40) return 'text-green-600';
    if (score >= 30) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getReadinessText = (score: number) => {
    if (score >= 40) return 'Good to go - Ready for exercise';
    if (score >= 30) return 'Light exercise recommended';
    if (score >= 20) return 'Rest or gentle activity only';
    return 'Rest recommended - Avoid exercise';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Daily Tracking</h1>

        {/* Morning Assessment */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Morning Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Slider
              label="Sleep Quality"
              value={assessment.morningAssessment!.sleepQuality}
              onChange={(value) => updateMorningAssessment('sleepQuality', value)}
              description="How well did you sleep last night?"
            />
            
            <Slider
              label="Energy Upon Waking"
              value={assessment.morningAssessment!.energyWaking}
              onChange={(value) => updateMorningAssessment('energyWaking', value)}
              description="How energetic do you feel this morning?"
            />
            
            <Slider
              label="Mental Clarity"
              value={assessment.morningAssessment!.mentalClarity}
              onChange={(value) => updateMorningAssessment('mentalClarity', value)}
              description="How clear and focused is your thinking?"
            />
            
            <Slider
              label="Physical Readiness"
              value={assessment.morningAssessment!.physicalReadiness}
              onChange={(value) => updateMorningAssessment('physicalReadiness', value)}
              description="How ready does your body feel for activity?"
            />
            
            <Slider
              label="Motivation Level"
              value={assessment.morningAssessment!.motivation}
              onChange={(value) => updateMorningAssessment('motivation', value)}
              description="How motivated do you feel today?"
            />

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Exercise Readiness Score</h4>
              <div className="flex justify-between items-center">
                <span className={`text-2xl font-bold ${getReadinessColor(assessment.morningAssessment!.exerciseReadinessScore)}`}>
                  {assessment.morningAssessment!.exerciseReadinessScore}/50
                </span>
                <span className={`text-sm font-medium ${getReadinessColor(assessment.morningAssessment!.exerciseReadinessScore)}`}>
                  {getReadinessText(assessment.morningAssessment!.exerciseReadinessScore)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daily Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="How are you feeling today? Any observations about your energy, mood, or symptoms..."
              value={assessment.dailyNotes || ''}
              onChange={(e) => setAssessment({ ...assessment, dailyNotes: e.target.value })}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Symptoms */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Symptoms Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {commonSymptoms.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom}
                    checked={assessment.symptoms?.includes(symptom) || false}
                    onCheckedChange={(checked) => updateSymptoms(symptom, checked as boolean)}
                  />
                  <label htmlFor={symptom} className="text-sm font-medium">
                    {symptom}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medical Data */}
        <Card className="mb-20">
          <CardHeader>
            <CardTitle>Medical Data (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hemoglobin (g/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={assessment.medicalData?.hemoglobin || ''}
                  onChange={(e) => updateMedicalData('hemoglobin', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hematocrit (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={assessment.medicalData?.hematocrit || ''}
                  onChange={(e) => updateMedicalData('hematocrit', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Systolic BP
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={assessment.medicalData?.bloodPressureSys || ''}
                  onChange={(e) => updateMedicalData('bloodPressureSys', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diastolic BP
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={assessment.medicalData?.bloodPressureDia || ''}
                  onChange={(e) => updateMedicalData('bloodPressureDia', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <Button 
            onClick={handleSave} 
            className="w-full h-12 text-lg"
            disabled={saved}
          >
            {saved ? (
              <>
                <CheckCircle size={20} className="mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Save Assessment
              </>
            )}
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}