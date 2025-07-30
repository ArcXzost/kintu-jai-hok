'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RPEScaleProps {
  value: number;
  onChange: (value: number) => void;
  showWarning?: boolean;
}

const rpeDescriptions = [
  { value: 0, label: 'Nothing at all', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 1, label: 'Very light', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 2, label: 'Light', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 3, label: 'Moderate', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 4, label: 'Somewhat heavy', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 5, label: 'Heavy', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 6, label: 'Very heavy', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 7, label: 'Very heavy', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 8, label: 'Very, very heavy', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 9, label: 'Very, very heavy', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 10, label: 'Maximum', color: 'bg-red-100 text-red-800 border-red-200' },
];

export default function RPEScale({ value, onChange, showWarning = true }: RPEScaleProps) {
  const shouldShowWarning = showWarning && value >= 6;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Rate of Perceived Exertion (RPE)</h3>
        <span className="text-2xl font-bold text-blue-600">{value}</span>
      </div>

      {shouldShowWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
          <AlertTriangle className="text-red-500" size={20} />
          <p className="text-red-700 text-sm font-medium">
            High exertion level! Consider stopping exercise and resting.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {rpeDescriptions.map((rpe) => (
          <button
            key={rpe.value}
            onClick={() => onChange(rpe.value)}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
              value === rpe.value 
                ? `${rpe.color} ring-2 ring-blue-500 ring-offset-2` 
                : `${rpe.color} hover:ring-1 hover:ring-blue-300`
            )}
          >
            <div className="flex items-center space-x-3">
              <span className="font-bold text-lg w-6">{rpe.value}</span>
              <span className="font-medium">{rpe.label}</span>
            </div>
            {value === rpe.value && (
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}