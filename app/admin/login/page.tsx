"use client";

import { useState } from "react";
import SignInRequestForm from "@/components/admin/SignInRequestForm";
import LoginForm from "@/components/LoginForm";
import { ToastProvider } from "@/components/dashboard/ToastProvider";

export default function AdminLoginPage() {
  const [showRequestForm, setShowRequestForm] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-slate-900/60 backdrop-blur">
          <div className="mb-8 space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 p-3">
                <img
                  src="/IGAC Logo White NOBG@4x-8 (1).png"
                  alt="IGAC Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-400">
              IGAC Admin Portal
            </p>
            <h1 className="text-3xl font-semibold text-white">
              {showRequestForm ? "Request Access" : "Admin Login"}
            </h1>
            <p className="text-sm text-slate-300">
              {showRequestForm
                ? "Request access to the admin dashboard. Your request will be reviewed by a super admin."
                : "Sign in with your approved admin account to manage events, certificates, and verification data."}
            </p>
          </div>

          {showRequestForm ? (
            <SignInRequestForm onBack={() => setShowRequestForm(false)} />
          ) : (
            <>
              <LoginForm />
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition"
                >
                  Don't have an account? Request access →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}

