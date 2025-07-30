'use client';

import { ExerciseType } from '@/lib/exercises';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Dumbbell, CheckCircle, XCircle, Play } from 'lucide-react';

interface ExerciseGuideProps {
  exercise: ExerciseType;
  onStartExercise?: () => void;
}

export default function ExerciseGuide({ exercise, onStartExercise }: ExerciseGuideProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardio': return '❤️';
      case 'strength': return '💪';
      case 'flexibility': return '🧘';
      default: return '🏃';
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'light': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'vigorous': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">{getCategoryIcon(exercise.category)}</span>
              <span>{exercise.name}</span>
            </CardTitle>
            <Badge className={getIntensityColor(exercise.intensity)}>
              {exercise.intensity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm">{exercise.duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Dumbbell size={16} className="text-gray-500" />
              <span className="text-sm">RPE: {exercise.targetRPE.join('-')}</span>
            </div>
          </div>
          <p className="text-gray-700">{exercise.description}</p>
        </CardContent>
      </Card>

      {/* Equipment Needed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipment Needed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map((item, index) => (
              <Badge key={index} variant="outline">{item}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video Tutorial */}
      {exercise.videoUrl && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2 text-blue-800">
              <Play size={20} />
              <span>Video Tutorial</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a 
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-4 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <Play size={20} className="text-white ml-1" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">{exercise.videoTitle || 'Watch Tutorial'}</h4>
                  <p className="text-sm text-blue-700">Learn proper form and technique</p>
                </div>
              </a>
              <p className="text-xs text-blue-700">
                💡 Watching the video first is highly recommended to ensure proper form and safety
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step-by-Step Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {exercise.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{instruction}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Modifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <CheckCircle size={20} className="text-green-600" />
            <span>Modifications & Adaptations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {exercise.modifications.map((modification, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span className="text-sm text-gray-700">{modification}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Thalassemia Considerations */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2 text-orange-800">
            <AlertTriangle size={20} />
            <span>Thalassemia-Specific Considerations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {exercise.thalassemiaConsiderations.map((consideration, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-orange-600 mt-1">⚠️</span>
                <span className="text-sm text-orange-800">{consideration}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Contraindications */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2 text-red-800">
            <XCircle size={20} />
            <span>When NOT to Do This Exercise</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {exercise.contraindications.map((contraindication, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">🚫</span>
                <span className="text-sm text-red-800">{contraindication}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Start Exercise Button */}
      {onStartExercise && (
        <Card>
          <CardContent className="pt-6">
            <button
              onClick={onStartExercise}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start This Exercise Session
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
