"use client";

import { useState } from "react";
import { Database } from "@/types/database";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsGrid from "@/components/dashboard/StatsGrid";
import EventManager from "@/components/dashboard/EventManager";
import BulkImportUploader from "@/components/dashboard/BulkImportUploader";
import ManualCertificateForm from "@/components/dashboard/ManualCertificateForm";
import RecentCertificates from "@/components/dashboard/RecentCertificates";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import QuickActions from "@/components/dashboard/QuickActions";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"] & {
  events?: { event_name: string | null; event_code: string | null } | null;
};

type Stats = {
  totalEvents: number;
  totalCertificates: number;
  revokedCount: number;
  verificationCount: number;
  pendingUsers: number;
};

type TabId = "overview" | "activity" | "imports";

export default function AdminDashboardContent({
  userEmail,
  stats,
  events,
  certificates,
}: {
  userEmail: string;
  stats: Stats;
  events: EventRow[];
  certificates: CertificateRow[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="space-y-8">
      <DashboardHeader email={userEmail} />

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-2 text-sm">
        {[
          { id: "overview" as TabId, label: "Overview" },
          { id: "activity" as TabId, label: "Activity" },
          { id: "imports" as TabId, label: "Imports" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              activeTab === tab.id
                ? "bg-emerald-500 text-emerald-950"
                : "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats always visible at top of dashboard */}
      {activeTab === "overview" && (
        <StatsGrid
          totalEvents={stats.totalEvents}
          totalCertificates={stats.totalCertificates}
          revokedCount={stats.revokedCount}
          verificationCount={stats.verificationCount}
          pendingUsers={stats.pendingUsers}
        />
      )}

      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <EventManager events={events} />
              <BulkImportUploader />
            </div>
            <ManualCertificateForm events={events} />
            <RecentCertificates certificates={certificates} />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="lg:col-span-1 space-y-6">
            <ActivityFeed recentCertificates={certificates} />
            <AnalyticsChart certificates={certificates} />
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ActivityFeed recentCertificates={certificates} />
            <AnalyticsChart certificates={certificates} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <RecentCertificates certificates={certificates} />
          </div>
        </div>
      )}

      {activeTab === "imports" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h2 className="text-lg font-semibold text-white mb-1">Bulk Imports</h2>
            <p className="text-sm text-slate-300">
              Paste or upload JSON from your spreadsheet export here. In the future, this
              area can show a history of imports and error reports.
            </p>
          </div>
          <BulkImportUploader />
        </div>
      )}

      {/* Quick Actions FAB is global */}
      <QuickActions />
    </div>
  );
}
