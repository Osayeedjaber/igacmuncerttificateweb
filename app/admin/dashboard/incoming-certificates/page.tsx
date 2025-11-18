import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/utils/auth";
import IncomingCertificatesList from "@/components/dashboard/IncomingCertificatesList";

export default async function IncomingCertificatesPage() {
  const user = await requireSuperAdmin();
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("incoming_certificates")
    .select(
      `
      id,
      created_at,
      status,
      section,
      payload,
      processed_at,
      rejection_reason,
      events:event_id (
        event_name,
        event_code
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message || "Failed to load incoming certificates");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Incoming Certificates</h1>
          <p className="text-slate-400 mt-2">
            Review certificates staged from Google Sheets and approve or reject them.
          </p>
        </div>
      </div>
      <IncomingCertificatesList
        incoming={(data as any[]) || []}
        currentUserEmail={user.email || "admin"}
      />
    </div>
  );
}
