"use client";

import { Database } from "@/types/database";

type Certificate = Database["public"]["Tables"]["certificates"]["Row"];

export default function AnalyticsChart({
  certificates,
}: {
  certificates: Certificate[];
}) {
  // Group by certificate type
  const typeCounts = certificates.reduce((acc, cert) => {
    acc[cert.certificate_type] = (acc[cert.certificate_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(typeCounts), 1);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        Certificates by Type
      </h2>
      <div className="space-y-3">
        {Object.entries(typeCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count]) => {
            const percentage = (count / maxCount) * 100;
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{type}</span>
                  <span className="text-sm font-semibold text-white">
                    {count}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

