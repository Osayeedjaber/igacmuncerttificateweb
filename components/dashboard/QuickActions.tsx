"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventIcon, CertificateIcon, XIcon } from "./Icons";

export default function QuickActions() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { label: "Create Event", icon: "event", href: "/admin/dashboard/events", action: () => router.push("/admin/dashboard/events") },
    { label: "Bulk Import", icon: "import", href: "/admin/dashboard", action: () => router.push("/admin/dashboard") },
    { label: "View Certificates", icon: "certificate", href: "/admin/dashboard/certificates", action: () => router.push("/admin/dashboard/certificates") },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-30">
      {isOpen && (
        <div className="mb-4 space-y-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.action();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-white/10"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {action.icon === "event" && <EventIcon />}
              {action.icon === "certificate" && <CertificateIcon />}
              {action.icon === "import" && (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg transition hover:scale-110 hover:shadow-xl"
      >
        {isOpen ? (
          <XIcon />
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

