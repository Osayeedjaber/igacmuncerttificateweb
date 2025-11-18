"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function VerifyPage() {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId.trim()) {
      setError("Please enter a certificate ID");
      return;
    }

    setLoading(true);
    setError(null);
    router.push(`/verify/${certificateId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 p-4">
              <Image
                src="/IGAC Logo White NOBG@4x-8 (1).png"
                alt="IGAC Logo"
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Verify Certificate
          </h1>
          <p className="text-lg text-slate-300">
            Enter your certificate ID or scan the QR code to verify your certificate
          </p>
        </div>

        {/* Verification Form */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-8 shadow-2xl">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Certificate ID
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={certificateId}
                  onChange={(e) => {
                    setCertificateId(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter certificate ID (e.g., igacmun-session-3-2025-abc123)"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-12 py-4 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  disabled={loading}
                />
                {certificateId && (
                  <button
                    type="button"
                    onClick={() => {
                      setCertificateId("");
                      setError(null);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    ×
                  </button>
                )}
              </div>
              {error && (
                <p className="mt-2 text-sm text-rose-400">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !certificateId.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 text-lg font-semibold text-white transition hover:from-emerald-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-emerald-500 disabled:hover:to-cyan-500"
            >
              {loading ? "Verifying..." : "Verify Certificate"}
            </button>
          </form>

        </div>

        {/* Instructions */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Find Your ID
            </h3>
            <p className="text-sm text-slate-400">
              Your certificate ID is printed on your certificate. It looks like: <code className="text-emerald-300">igacmun-session-3-2025-abc123</code>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Enter Certificate ID
            </h3>
            <p className="text-sm text-slate-400">
              Type or paste your certificate ID in the search box above to verify your certificate instantly.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Verify Instantly
            </h3>
            <p className="text-sm text-slate-400">
              Get instant verification results with full certificate details and verification status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

