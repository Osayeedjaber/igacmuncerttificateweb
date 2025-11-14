"use client";

import { useState } from "react";
import { XIcon } from "./Icons";

type Role = "super_admin" | "admin" | "mod";

export default function RoleChangeDialog({
  isOpen,
  onClose,
  currentRole,
  userEmail,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentRole: string;
  userEmail: string;
  onConfirm: (newRole: Role, password?: string) => Promise<void>;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole as Role);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresPassword = (selectedRole === "super_admin" || selectedRole === "admin") && selectedRole !== currentRole;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (requiresPassword && !password) {
      setError("Password is required to change role to admin or super_admin");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(selectedRole, requiresPassword ? password : undefined);
      onClose();
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change role");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Change User Role</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-slate-300 mb-2">
              Changing role for: <span className="font-semibold text-white">{userEmail}</span>
            </p>
            <p className="text-sm text-slate-400 mb-4">
              Current role: <span className="font-medium text-slate-300">{currentRole.replace("_", " ")}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              New Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as Role);
                setPassword("");
                setError(null);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="mod">Mod (Read-only)</option>
              <option value="admin">Admin (Full access except user management)</option>
              <option value="super_admin">Super Admin (Full access)</option>
            </select>
          </div>

          {requiresPassword && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role Change Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter role change password"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                Password required to assign admin or super_admin roles
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedRole === currentRole}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Changing..." : "Change Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

