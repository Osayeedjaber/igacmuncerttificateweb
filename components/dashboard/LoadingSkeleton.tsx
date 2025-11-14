export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
      <div className="h-4 bg-slate-800 rounded w-1/2"></div>
      <div className="h-4 bg-slate-800 rounded w-5/6"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-800/50 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

