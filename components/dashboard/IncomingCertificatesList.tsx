"use client";

import { useState, useMemo } from "react";

type IncomingCertificate = {
  id: string;
  created_at: string;
  processed_at?: string | null;
  status: "pending" | "accepted" | "rejected";
  section: string;
  rejection_reason?: string | null;
  payload: Record<string, any>;
  events?: {
    event_name: string | null;
    event_code: string | null;
  } | null;
};

export default function IncomingCertificatesList({
  incoming,
  currentUserEmail,
}: {
  incoming: IncomingCertificate[];
  currentUserEmail: string;
}) {
  const [items, setItems] = useState<IncomingCertificate[]>(incoming);
  const [filterStatus, setFilterStatus] = useState<"pending" | "accepted" | "rejected" | "all">("pending");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return items;
    return items.filter((i) => i.status === filterStatus);
  }, [items, filterStatus]);

  async function handleApprove(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/incoming-certificates/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to approve");
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "accepted", processed_at: new Date().toISOString() }
            : item
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to approve certificate");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Reason for rejection?", "Rejected by admin");
    if (reason === null) return;

    setLoadingId(id);
    try {
      const res = await fetch(`/api/incoming-certificates/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to reject");
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "rejected", processed_at: new Date().toISOString(), rejection_reason: reason }
            : item
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to reject certificate");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as "pending" | "accepted" | "rejected" | "all")
          }
          className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
        <span className="text-sm text-slate-400">
          Showing {filtered.length} of {items.length} incoming rows
        </span>
        <div className="flex-1" />
        <span className="text-xs text-slate-500">Signed in as {currentUserEmail}</span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const p = item.payload || {};
                const participant = p.participant_name || p.name || "(no name)";
                const school = p.school || "";
                const createdAt = item.created_at
                  ? new Date(item.created_at).toLocaleString()
                  : "";
                const eventLabel = item.events?.event_name || item.events?.event_code || "—";

                return (
                  <tr
                    key={item.id}
                    className="border-t border-white/5 bg-white/5 text-sm text-white"
                  >
                    <td className="px-4 py-3 text-xs uppercase text-slate-300">
                      {item.section}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{participant}</div>
                      {school && (
                        <p className="text-xs text-slate-300">{school}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">{school}</td>
                    <td className="px-4 py-3 text-sm text-slate-200">{eventLabel}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "pending"
                            ? "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                            : item.status === "accepted"
                            ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-200 border border-rose-500/30"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.status === "rejected" && item.rejection_reason && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {item.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{createdAt}</td>
                    <td className="px-4 py-3">
                      {item.status === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={loadingId === item.id}
                            onClick={() => handleApprove(item.id)}
                            className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {loadingId === item.id ? "Approving..." : "Approve"}
                          </button>
                          <button
                            disabled={loadingId === item.id}
                            onClick={() => handleReject(item.id)}
                            className="rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {loadingId === item.id ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No incoming certificates found for this filter.
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
