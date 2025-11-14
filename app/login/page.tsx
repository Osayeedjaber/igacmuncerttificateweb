"use client";

import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-slate-900/60 backdrop-blur">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-400">
            IGAC Verification
          </p>
          <h1 className="text-3xl font-semibold text-white">Admin Login</h1>
          <p className="text-sm text-slate-300">
            Use your approved admin credentials to access the dashboard.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

