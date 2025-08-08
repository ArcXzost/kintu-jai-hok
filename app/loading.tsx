'use client';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-200 rounded" />
        <div className="h-32 w-full bg-white rounded-lg shadow-sm" />
        <div className="h-24 w-full bg-white rounded-lg shadow-sm" />
        <div className="h-24 w-full bg-white rounded-lg shadow-sm" />
      </div>
    </div>
  );
}
