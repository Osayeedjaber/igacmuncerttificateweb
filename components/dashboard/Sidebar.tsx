"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import LogoutButton from "./LogoutButton";
import { DashboardIcon, CertificateIcon, EventIcon, UsersIcon } from "./Icons";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { name: "Certificates", href: "/admin/dashboard/certificates", icon: "certificate" },
  { name: "Events", href: "/admin/dashboard/events", icon: "event" },
  { name: "Users", href: "/admin/dashboard/users", icon: "users" },
];

export default function Sidebar({ user }: { user: { email: string; role: string } }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-slate-900/95 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Logo/Header */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 p-2">
              <Image
                src="/IGAC Logo White NOBG@4x-8 (1).png"
                alt="IGAC Logo"
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">IGAC</h1>
              <p className="text-xs text-slate-400">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.email}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.icon === "dashboard" && <DashboardIcon />}
                {item.icon === "certificate" && <CertificateIcon />}
                {item.icon === "event" && <EventIcon />}
                {item.icon === "users" && <UsersIcon />}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

