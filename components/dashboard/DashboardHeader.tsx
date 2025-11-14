"use client";

import LogoutButton from "./LogoutButton";

export default function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/70 p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.6em] text-emerald-400">
          Control Room
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Certificate Command Center
        </h1>
        <p className="text-sm text-slate-300">
          Signed in as <span className="font-medium text-white">{email}</span>
        </p>
      </div>
      <LogoutButton />
    </header>
  );
}

