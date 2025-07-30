'use client';

import { cn } from '@/lib/utils';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  description?: string;
  className?: string;
}

export default function Slider({ value, onChange, min = 1, max = 10, label, description, className }: SliderProps) {
  const getColor = (val: number) => {
    if (val <= 3) return 'bg-red-500';
    if (val <= 5) return 'bg-yellow-500';
    if (val <= 7) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className={cn("px-2 py-1 rounded text-white text-sm font-bold", getColor(value))}>
          {value}
        </span>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}