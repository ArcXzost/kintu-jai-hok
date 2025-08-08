export default function ReportsLoading() {
  return (
    <div className="px-4 py-6 space-y-4 animate-pulse">
      <div className="h-6 w-40 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-40 bg-white rounded-lg shadow-sm" />
        <div className="h-40 bg-white rounded-lg shadow-sm" />
      </div>
      <div className="h-32 w-full bg-white rounded-lg shadow-sm" />
    </div>
  );
}
