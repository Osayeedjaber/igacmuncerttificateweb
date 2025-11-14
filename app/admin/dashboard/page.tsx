import StatsGrid from "@/components/dashboard/StatsGrid";
import EventManager from "@/components/dashboard/EventManager";
import BulkImportUploader from "@/components/dashboard/BulkImportUploader";
import ManualCertificateForm from "@/components/dashboard/ManualCertificateForm";
import RecentCertificates from "@/components/dashboard/RecentCertificates";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import QuickActions from "@/components/dashboard/QuickActions";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import { Database } from "@/types/database";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];

export default async function DashboardPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const [{ data: eventsData }, { data: certificatesData }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("certificates")
      .select(
        `
        *,
        events (
          event_name,
          event_code
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const [
    { count: totalCertificates },
    { count: revokedCount },
    { data: verificationData },
  ] =
    await Promise.all([
      supabase
        .from("certificates")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .eq("status", "revoked"),
      supabase.from("certificates").select("verification_count"),
    ]);

  const verificationRows =
    (verificationData as Pick<CertificateRow, "verification_count">[] | null) ??
    [];

  const totalVerifications = verificationRows.reduce(
    (sum, entry) => sum + (entry.verification_count || 0),
    0
  );

  const events: EventRow[] = eventsData ?? [];
  const certificates: (CertificateRow & {
    events?: { event_name: string | null; event_code: string | null } | null;
  })[] = certificatesData ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-2">
          Welcome back, {user.email}. Here's what's happening with your certificates.
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid
        totalEvents={events.length}
        totalCertificates={totalCertificates ?? 0}
        revokedCount={revokedCount ?? 0}
        verificationCount={totalVerifications}
      />

      {/* Main Content Grid */}
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

      {/* Quick Actions FAB */}
      <QuickActions />
    </div>
  );
}

