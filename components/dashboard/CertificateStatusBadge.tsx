"use client";

export default function CertificateStatusBadge({ status }: { status: string }) {
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
