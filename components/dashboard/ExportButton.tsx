"use client";

import { useState } from "react";
import { Database } from "@/types/database";
import { ExportIcon } from "./Icons";

type Certificate = Database["public"]["Tables"]["certificates"]["Row"] & {
  events?: { event_name: string | null; event_code: string | null } | null;
};

export default function ExportButton({ certificates }: { certificates: Certificate[] }) {
  const [loading, setLoading] = useState(false);

  const exportToCSV = () => {
    setLoading(true);
    try {
      const headers = [
        "Certificate ID",
        "Participant Name",
        "School",
        "Certificate Type",
        "Event",
        "Event Code",
        "Date Issued",
        "Status",
        "Verification Count",
      ];

      const rows = certificates.map((cert) => [
        cert.certificate_id,
        cert.participant_name,
        cert.school,
        cert.certificate_type,
        cert.events?.event_name || "",
        cert.events?.event_code || "",
        cert.date_issued,
        cert.status,
        cert.verification_count || 0,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `certificates-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={loading || certificates.length === 0}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ExportIcon />
      {loading ? "Exporting..." : "Export CSV"}
    </button>
  );
}

