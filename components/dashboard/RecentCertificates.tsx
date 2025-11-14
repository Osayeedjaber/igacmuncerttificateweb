"use client";

import { Database } from "@/types/database";
import { useRouter } from "next/navigation";
import { formatDateReadable } from "@/lib/utils/date-format";

type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"] & {
  events?: { event_name: string | null; event_code: string | null } | null;
};


export default function RecentCertificates({
  certificates,
}: {
  certificates: CertificateRow[];
}) {
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">
            Validation log
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Latest certificates
          </h2>
          <p className="text-sm text-slate-300">
            IDs are minted the moment you upload the JSON batch.
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/5">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Participant</th>
              <th className="px-4 py-3">Certificate ID</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Issued</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((certificate) => (
              <tr
                key={certificate.id}
                className="border-t border-white/5 bg-white/5 text-sm text-white cursor-pointer transition hover:bg-white/10 hover:shadow-lg"
                onClick={() => router.push(`/admin/dashboard/certificates/${certificate.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="font-semibold">{certificate.participant_name}</div>
                  <p className="text-xs text-slate-300">{certificate.school}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-emerald-300">
                  {certificate.certificate_id}
                </td>
                <td className="px-4 py-3">
                  {certificate.events?.event_name || "—"}
                  <div className="text-xs text-slate-400">
                    {certificate.events?.event_code}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {certificate.certificate_type}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={certificate.status} />
                </td>
                    <td className="px-4 py-3 text-slate-200">
                      {certificate.date_issued
                        ? formatDateReadable(certificate.date_issued)
                        : "—"}
                    </td>
              </tr>
            ))}
            {certificates.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No certificates have been generated yet. Upload JSON to get
                  started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "revoked"
      ? "bg-rose-500/20 text-rose-200 border-rose-500/30"
      : "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${config}`}
    >
      {status}
    </span>
  );
}

