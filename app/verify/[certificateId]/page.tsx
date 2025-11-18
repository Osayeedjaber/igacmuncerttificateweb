"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDateReadable } from "@/lib/utils/date-format";

type CertificateData = {
  certificate_id: string;
  participant_name: string;
  school: string;
  certificate_type: string;
  event: string | null;
  event_code: string | null;
  date_issued: string;
  status: string;
  pdf_available: boolean;
  pdf_download_url: string | null;
  country?: string;
  committee?: string;
  segment?: string;
  team_name?: string;
  [key: string]: any;
};

export default function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState<string>(params.certificateId);
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [revokedInfo, setRevokedInfo] = useState<{
    revoked_at: string;
    revoked_reason: string;
  } | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCertificate() {
      const id = params.certificateId;
      setCertificateId(id);
      setLoading(true);

      try {
        const response = await fetch(`/api/verify/${id}`);
        const data = await response.json();

        if (data.valid) {
          setValid(true);
          setCertificate(data.certificate);
          setRevoked(false);
        } else if (data.status === "revoked") {
          setValid(false);
          setRevoked(true);
          setRevokedInfo({
            revoked_at: data.revoked_at,
            revoked_reason: data.revoked_reason,
          });
          setCertificate(data.certificate);
        } else {
          setValid(false);
          setError(data.error || "Certificate not found");
        }
      } catch (err: any) {
        setValid(false);
        setError(err.message || "Failed to verify certificate");
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
          <p className="mt-4 text-slate-300">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error && !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-rose-500/20 bg-rose-950/20 p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-300">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Certificate Not Found
            </h1>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => router.push("/verify")}
              className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400"
            >
              Try Another ID
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 p-3">
              <Image
                src="/IGAC Logo White NOBG@4x-8 (1).png"
                alt="IGAC Logo"
                width={64}
                height={64}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Certificate Verification
          </h1>
        </div>

        {/* Certificate Card */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-8 shadow-2xl">
          {/* Status Badge */}
          <div className="mb-6 flex justify-center">
            {revoked ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/20 px-6 py-3">
                <svg className="h-5 w-5 text-rose-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold text-rose-200">
                  Certificate Revoked
                </span>
              </div>
            ) : valid ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-6 py-3">
                <svg className="h-5 w-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-emerald-200">
                  Certificate Verified
                </span>
              </div>
            ) : null}
          </div>

          {revoked && revokedInfo && (
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-950/20 p-4">
              <p className="text-sm font-semibold text-rose-300 mb-2">
                Revocation Details
              </p>
              <p className="text-sm text-slate-300">
                <strong>Revoked on:</strong>{" "}
                {formatDateReadable(revokedInfo.revoked_at)}
              </p>
              <p className="text-sm text-slate-300 mt-1">
                <strong>Reason:</strong> {revokedInfo.revoked_reason || "Not specified"}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                For questions, contact: intlglobalaffairscouncil@gmail.com
              </p>
            </div>
          )}

          {certificate && (
            <div className="space-y-6">
              {/* Main Info */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                    Participant Name
                  </p>
                  <p className="text-xl font-semibold text-white">
                    {certificate.participant_name}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                    School
                  </p>
                  <p className="text-xl font-semibold text-white">
                    {certificate.school}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                    Certificate Type
                  </p>
                  <p className="text-lg font-medium text-white">
                    {certificate.certificate_type}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                    Date Issued
                  </p>
                  <p className="text-lg font-medium text-white">
                    {formatDateReadable(certificate.date_issued)}
                  </p>
                </div>
              </div>

              {/* Event Info */}
              {certificate.event && (
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                    Event
                  </p>
                  <p className="text-lg font-medium text-white">
                    {certificate.event}
                  </p>
                  {certificate.event_code && (
                    <p className="text-sm text-slate-400 mt-1">
                      {certificate.event_code}
                    </p>
                  )}
                </div>
              )}

              {/* Additional Info */}
              {(certificate.country || certificate.committee || certificate.segment || certificate.team_name) && (
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-3">
                    Additional Information
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {certificate.country && (
                      <div>
                        <p className="text-xs text-slate-400">Country</p>
                        <p className="text-sm font-medium text-white">
                          {certificate.country}
                        </p>
                      </div>
                    )}
                    {certificate.committee && (
                      <div>
                        <p className="text-xs text-slate-400">Committee</p>
                        <p className="text-sm font-medium text-white">
                          {certificate.committee}
                        </p>
                      </div>
                    )}
                    {certificate.segment && (
                      <div>
                        <p className="text-xs text-slate-400">Segment</p>
                        <p className="text-sm font-medium text-white">
                          {certificate.segment}
                        </p>
                      </div>
                    )}
                    {certificate.team_name && (
                      <div>
                        <p className="text-xs text-slate-400">Team Name</p>
                        <p className="text-sm font-medium text-white">
                          {certificate.team_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Certificate ID */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 mb-2">
                  Certificate ID
                </p>
                <p className="font-mono text-sm text-emerald-200 break-all">
                  {certificate.certificate_id}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/verify/${certificate.certificate_id}`;
                    navigator.clipboard
                      .writeText(url)
                      .then(() => {
                        setCopyMessage("Certificate link copied to clipboard.");
                        setTimeout(() => setCopyMessage(null), 3000);
                      })
                      .catch(() => {
                        setCopyMessage("Unable to copy link. You can copy it manually from the address bar.");
                        setTimeout(() => setCopyMessage(null), 4000);
                      });
                  }}
                  className="flex items-center justify-center gap-2 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Share Certificate
                </button>
                {certificate.pdf_available && certificate.pdf_download_url && (
                  <button
                    onClick={() => window.open(certificate.pdf_download_url!, "_blank")}
                    className="flex items-center justify-center gap-2 flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                )}
                <button
                  onClick={() => router.push("/verify")}
                  className="flex items-center justify-center gap-2 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Verify Another
                </button>
              </div>
              {copyMessage && (
                <p className="mt-2 w-full text-xs text-emerald-300">
                  {copyMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          <p>
            Need help? Contact us at{" "}
            <a
              href="mailto:intlglobalaffairscouncil@gmail.com"
              className="text-emerald-400 hover:text-emerald-300"
            >
              intlglobalaffairscouncil@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

