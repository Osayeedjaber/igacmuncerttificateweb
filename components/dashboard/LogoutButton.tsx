"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogoutIcon } from "./Icons";

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.replace("/");
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
    >
      <LogoutIcon />
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}

