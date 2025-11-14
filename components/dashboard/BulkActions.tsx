"use client";

import { useState } from "react";
import { useToast } from "./ToastProvider";
import ConfirmationDialog from "./ConfirmationDialog";
import { useRouter } from "next/navigation";

type Certificate = {
  id: string;
  certificate_id: string;
  participant_name: string;
};

export default function BulkActions({
  selectedCertificates,
  onClearSelection,
}: {
  selectedCertificates: Certificate[];
  onClearSelection: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const handleBulkRevoke = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedCertificates.map((cert) =>
          fetch(`/api/certificates/${cert.id}/revoke`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              reason: "Bulk revocation",
            }),
          })
        )
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.showToast(
          `Revoked ${successCount} certificate${successCount > 1 ? "s" : ""}${failCount > 0 ? `, ${failCount} failed` : ""}`,
          successCount === results.length ? "success" : "info"
        );
        onClearSelection();
        router.refresh();
      } else {
        toast.showToast("Failed to revoke certificates", "error");
      }
    } catch (error) {
      toast.showToast("Failed to revoke certificates", "error");
    } finally {
      setLoading(false);
      setShowRevokeDialog(false);
    }
  };

  if (selectedCertificates.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-8 left-72 right-8 z-30 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-sm p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-white">
              {selectedCertificates.length} certificate
              {selectedCertificates.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={onClearSelection}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Clear selection
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRevokeDialog(true)}
              className="rounded-xl border border-rose-500/30 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/30"
            >
              Revoke Selected
            </button>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showRevokeDialog}
        title="Revoke Certificates"
        message={`Are you sure you want to revoke ${selectedCertificates.length} certificate${selectedCertificates.length > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText="Revoke"
        cancelText="Cancel"
        onConfirm={handleBulkRevoke}
        onCancel={() => setShowRevokeDialog(false)}
        variant="danger"
      />
    </>
  );
}

