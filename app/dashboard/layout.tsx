import { ReactNode } from "react";
import { requireAdmin } from "@/lib/utils/auth";
import Sidebar from "@/components/dashboard/Sidebar";
import { ToastProvider } from "@/components/dashboard/ToastProvider";
import KeyboardShortcuts from "@/components/dashboard/KeyboardShortcuts";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <ToastProvider>
      <KeyboardShortcuts />
      <div className="min-h-screen bg-slate-950 text-white">
        <Sidebar user={{ email: user.email || "admin", role: user.role || "admin" }} />
        <main className="ml-64 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

