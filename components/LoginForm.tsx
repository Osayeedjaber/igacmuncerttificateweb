 "use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Unable to sign in");
      }

      // Only refresh after we know the session cookie is set
      await fetch("/api/auth/me", { credentials: "include" });
      router.replace("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          placeholder="admin@igac.info"
          suppressHydrationWarning
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Password</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          placeholder="••••••••"
          suppressHydrationWarning
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/40"
      >
        {loading ? "Signing in..." : "Access Dashboard"}
      </button>
      <p className="text-center text-xs text-slate-400">
        Only approved super admins and admins can access the dashboard.
      </p>
    </form>
  );
}

