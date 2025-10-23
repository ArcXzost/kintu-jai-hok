import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default function ExerciseLoading() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <LoadingSkeleton />
    </div>
  );
}
