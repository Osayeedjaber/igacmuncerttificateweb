import AdminDashboardContent from "@/components/dashboard/AdminDashboardContent";
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
    { count: pendingUsers },
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
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("account_status", "pending_approval"),
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
    <AdminDashboardContent
      userEmail={user.email || "admin"}
      stats={{
        totalEvents: events.length,
        totalCertificates: totalCertificates ?? 0,
        revokedCount: revokedCount ?? 0,
        verificationCount: totalVerifications,
        pendingUsers: pendingUsers ?? 0,
      }}
      events={events}
      certificates={certificates}
    />
  );
}

