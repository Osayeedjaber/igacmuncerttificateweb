import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import { Database } from "@/types/database";
import SearchBar from "@/components/dashboard/SearchBar";
import ExportButton from "@/components/dashboard/ExportButton";
import CertificatesList from "@/components/dashboard/CertificatesList";

type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];

export default async function CertificatesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: certificatesData } = await supabase
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
    .limit(100);

  const certificates: (CertificateRow & {
    events?: { event_name: string | null; event_code: string | null } | null;
  })[] = certificatesData ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Certificates</h1>
          <p className="text-slate-400 mt-2">
            View and manage all certificates in the system.
          </p>
        </div>
        <ExportButton certificates={certificates} />
      </div>
      <CertificatesList certificates={certificates} />
    </div>
  );
}

