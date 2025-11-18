"use client";

import { useState, useMemo } from "react";
import { Database } from "@/types/database";
import { useRouter } from "next/navigation";
import SearchBar from "./SearchBar";
import BulkActions from "./BulkActions";
import CertificateStatusBadge from "./CertificateStatusBadge";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        cert.participant_name.toLowerCase().includes(query) ||
        cert.certificate_id.toLowerCase().includes(query) ||
        cert.school.toLowerCase().includes(query) ||
        cert.certificate_type.toLowerCase().includes(query);

      const matchesStatus =
        filterStatus === "all" || cert.status === filterStatus;

      const matchesEvent =
        filterEvent === "all" || cert.events?.event_code === filterEvent;

      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [certificates, searchQuery, filterStatus, filterEvent]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existingId) => existingId !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const selectedCertificates = useMemo(
    () =>
      certificates
        .filter((cert) => selectedIds.includes(cert.id))
        .map((cert) => ({
          id: cert.id,
          certificate_id: cert.certificate_id,
          participant_name: cert.participant_name,
        })),
    [certificates, selectedIds]
  );

  const allVisibleSelected =
    filteredCertificates.length > 0 &&
    filteredCertificates.every((cert) => selectedIds.includes(cert.id));

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
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() => {
                      if (allVisibleSelected) {
                        // Deselect all visible
                        setSelectedIds((prev) =>
                          prev.filter(
                            (id) => !filteredCertificates.some((cert) => cert.id === id)
                          )
                        );
                      } else {
                        // Select all visible
                        const visibleIds = filteredCertificates.map((cert) => cert.id);
                        setSelectedIds((prev) => [
                          ...prev,
                          ...visibleIds.filter((id) => !prev.includes(id)),
                        ]);
                      }
                    }}
                    className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-emerald-500 focus:ring-emerald-500/40"
                  />
                </th>
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
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(certificate.id)}
                      onChange={() => toggleSelection(certificate.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-emerald-500 focus:ring-emerald-500/40"
                    />
                  </td>
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
                    <CertificateStatusBadge status={certificate.status} />
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
                    colSpan={8}
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

      <BulkActions
        selectedCertificates={selectedCertificates}
        onClearSelection={clearSelection}
      />
    </div>
  );
}


