"use client";

import { useState, useMemo } from "react";
import { Database } from "@/types/database";
import { useRouter } from "next/navigation";
import SearchBar from "./SearchBar";

type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"] & {
  events?: { event_name: string | null; event_code: string | null } | null;
};

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function CertificatesList({
  certificates,
}: {
  certificates: CertificateRow[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "revoked">("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");

  // Get unique events for filter
  const events = useMemo(() => {
    const eventSet = new Set<string>();
    certificates.forEach((cert) => {
      if (cert.events?.event_code) {
        eventSet.add(cert.events.event_code);
      }
    });
    return Array.from(eventSet);
  }, [certificates]);

  // Filter certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesSearch =
        cert.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certificate_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certificate_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || cert.status === filterStatus;

      const matchesEvent =
        filterEvent === "all" || cert.events?.event_code === filterEvent;

      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [certificates, searchQuery, filterStatus, filterEvent]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search by name, ID, school, or type..."
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "active" | "revoked")
            }
            className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </select>
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Events</option>
            {events.map((eventCode) => (
              <option key={eventCode} value={eventCode}>
                {eventCode}
              </option>
            ))}
          </select>
          <div className="flex-1" />
          <div className="text-sm text-slate-400">
            Showing {filteredCertificates.length} of {certificates.length} certificates
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">Certificate ID</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Verifications</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map((certificate) => (
                <tr
                  key={certificate.id}
                  className="border-t border-white/5 bg-white/5 text-sm text-white cursor-pointer hover:bg-white/10 transition"
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
                      ? formatter.format(new Date(certificate.date_issued))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {certificate.verification_count || 0}
                  </td>
                </tr>
              ))}
              {filteredCertificates.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No certificates found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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

