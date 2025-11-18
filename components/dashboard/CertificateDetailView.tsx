"use client";

import { Database } from "@/types/database";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";
import ConfirmationDialog from "./ConfirmationDialog";
import CertificateStatusBadge from "./CertificateStatusBadge";
import { formatDateReadable, formatDateTimeReadable } from "@/lib/utils/date-format";

type Certificate = Database["public"]["Tables"]["certificates"]["Row"] & {
  events?: Database["public"]["Tables"]["events"]["Row"] | null;
  certificate_metadata?: Array<Database["public"]["Tables"]["certificate_metadata"]["Row"]> | null;
};

type User = {
  id: string;
  role: string;
  account_status: string;
};

export default function CertificateDetailView({
  certificate: initialCertificate,
  user,
}: {
  certificate: Certificate;
  user: User;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState(initialCertificate);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if user can edit (admin or super_admin)
  const canEdit = user.role === "admin" || user.role === "super_admin";

// Organize metadata into an object
  const metadata = (certificate.certificate_metadata || []).reduce((acc: any, meta: any) => {
    if (meta.field_type === "json" || meta.field_type === "array") {
      try {
        acc[meta.field_name] = JSON.parse(meta.field_value);
      } catch {
        acc[meta.field_name] = meta.field_value;
      }
    } else {
      acc[meta.field_name] = meta.field_value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  const [formData, setFormData] = useState({
    participant_name: certificate.participant_name,
    school: certificate.school,
    certificate_type: certificate.certificate_type,
    date_issued: certificate.date_issued,
    status: certificate.status,
    ...metadata,
  });

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Separate main fields from metadata
      const mainFields: any = {
        participant_name: formData.participant_name,
        school: formData.school,
        certificate_type: formData.certificate_type,
        date_issued: formData.date_issued,
        status: formData.status,
      };

      // Get metadata fields (exclude main fields)
      const metadataFields = Object.keys(formData).filter(
        (key) => !["participant_name", "school", "certificate_type", "date_issued", "status"].includes(key)
      );

      // Update main certificate
      const response = await fetch(`/api/certificates/${certificate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mainFields),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Failed to update certificate");
      }

      // Update metadata if there are metadata fields
      if (metadataFields.length > 0) {
        const metadataUpdates = metadataFields.map((fieldName) => ({
          certificate_id: certificate.id,
          field_name: fieldName,
          field_value:
            typeof formData[fieldName as keyof typeof formData] === "object"
              ? JSON.stringify(formData[fieldName as keyof typeof formData])
              : String(formData[fieldName as keyof typeof formData]),
          field_type:
            typeof formData[fieldName as keyof typeof formData] === "object"
              ? "json"
              : "text",
        }));

        // Delete existing metadata and insert new ones
        await fetch(`/api/certificates/${certificate.id}/metadata`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ metadata: metadataUpdates }),
        });
      }

      toast.showToast("Certificate updated successfully!", "success");
      router.refresh();
      setIsEditing(false);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to update certificate";
      setError(errorMsg);
      toast.showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      participant_name: certificate.participant_name,
      school: certificate.school,
      certificate_type: certificate.certificate_type,
      date_issued: certificate.date_issued,
      status: certificate.status,
      ...metadata,
    });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Certificate Details</h1>
          <p className="text-sm text-slate-400 mt-1">
            View and manage certificate information
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-600/50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Information */}
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Main Information</h2>

          <Field label="Certificate ID" readOnly>
            <input
              type="text"
              value={certificate.certificate_id}
              readOnly
              className="input bg-slate-950/50"
            />
          </Field>

          <Field label="Participant Name">
            {isEditing ? (
              <input
                type="text"
                value={formData.participant_name}
                onChange={(e) =>
                  setFormData({ ...formData, participant_name: e.target.value })
                }
                className="input"
                required
              />
            ) : (
              <div className="input bg-slate-950/50">{formData.participant_name}</div>
            )}
          </Field>

          <Field label="School">
            {isEditing ? (
              <input
                type="text"
                value={formData.school}
                onChange={(e) =>
                  setFormData({ ...formData, school: e.target.value })
                }
                className="input"
                required
              />
            ) : (
              <div className="input bg-slate-950/50">{formData.school}</div>
            )}
          </Field>

          <Field label="Certificate Type">
            {isEditing ? (
              <input
                type="text"
                value={formData.certificate_type}
                onChange={(e) =>
                  setFormData({ ...formData, certificate_type: e.target.value })
                }
                className="input"
                required
              />
            ) : (
              <div className="input bg-slate-950/50">{formData.certificate_type}</div>
            )}
          </Field>

          <Field label="Date Issued">
            {isEditing ? (
              <input
                type="date"
                value={formData.date_issued}
                onChange={(e) =>
                  setFormData({ ...formData, date_issued: e.target.value })
                }
                className="input"
                required
              />
            ) : (
              <div className="input bg-slate-950/50">
                {formatDateReadable(formData.date_issued)}
              </div>
            )}
          </Field>

          <Field label="Status">
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "revoked",
                  })
                }
                className="input"
              >
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
              </select>
            ) : (
              <div className="input bg-slate-950/50">
                <CertificateStatusBadge status={formData.status} />
              </div>
            )}
          </Field>
        </div>

        {/* Event & Metadata */}
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Event Information</h2>

          <Field label="Event Name" readOnly>
            <div className="input bg-slate-950/50">
              {certificate.events?.event_name || "—"}
            </div>
          </Field>

          <Field label="Event Code" readOnly>
            <div className="input bg-slate-950/50">
              {certificate.events?.event_code || "—"}
            </div>
          </Field>

          <h2 className="text-xl font-semibold text-white mt-6">Additional Information</h2>

          {Object.keys(metadata).length > 0 ? (
            Object.entries(metadata).map(([key, value]) => (
              <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}>
                {isEditing ? (
                  <input
                    type="text"
                    value={String(value)}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className="input"
                  />
                ) : (
                  <div className="input bg-slate-950/50">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </div>
                )}
              </Field>
            ))
          ) : (
            <p className="text-sm text-slate-400">No additional information</p>
          )}

          {/* Add new metadata field */}
          {isEditing && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-slate-400 mb-2">
                Add new fields by editing existing ones above
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QR Code & Verification Info */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Verification Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Verification Count
            </p>
            <p className="text-2xl font-bold text-white">
              {certificate.verification_count || 0}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Last Verified
            </p>
            <p className="text-sm text-white">
              {certificate.last_verified_at
                ? formatDateTimeReadable(certificate.last_verified_at)
                : "Never"}
            </p>
          </div>
        </div>
        {certificate.qr_code_image_path && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              QR Code
            </p>
            <img
              src={certificate.qr_code_image_path}
              alt="QR Code"
              className="w-32 h-32 border border-white/10 rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  readOnly,
}: {
  label: string;
  children: React.ReactNode;
  readOnly?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
        {readOnly && <span className="ml-2 text-slate-500">(read-only)</span>}
      </span>
      {children}
    </label>
  );
}

