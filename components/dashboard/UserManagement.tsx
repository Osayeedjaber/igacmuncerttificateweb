"use client";

import { Database } from "@/types/database";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateReadable } from "@/lib/utils/date-format";
import { useToast } from "./ToastProvider";
import RoleChangeDialog from "./RoleChangeDialog";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export default function UserManagement({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending_approval" | "approved" | "rejected"
  >("pending_approval");
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    isOpen: boolean;
    userId: string;
    currentRole: string;
    userEmail: string;
  }>({
    isOpen: false,
    userId: "",
    currentRole: "",
    userEmail: "",
  });

  const handleApprove = async (userId: string) => {
    setLoading(userId);
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        toast.showToast("User approved successfully", "success");
        router.refresh();
      } else {
        const data = await response.json();
        toast.showToast(data.error || "Failed to approve user", "error");
      }
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast.showToast("Failed to approve user", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setLoading(userId);
    try {
      const response = await fetch(`/api/users/${userId}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        toast.showToast("User rejected successfully", "success");
        router.refresh();
      } else {
        const data = await response.json();
        toast.showToast(data.error || "Failed to reject user", "error");
      }
    } catch (error) {
      console.error("Failed to reject user:", error);
      toast.showToast("Failed to reject user", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string, password?: string) => {
    setLoading(userId);
    try {
      const response = await fetch(`/api/users/${userId}/change-role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ new_role: newRole, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.showToast(`User role changed to ${newRole.replace("_", " ")}`, "success");
        router.refresh();
      } else {
        toast.showToast(data.error || "Failed to change role", "error");
        throw new Error(data.error || "Failed to change role");
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(null);
    }
  };

  const filteredUsers = users.filter((user) =>
    statusFilter === "all" ? true : user.account_status === statusFilter
  );

  const getRoleBadge = (role: string) => {
    const colors =
      role === "super_admin"
        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
        : role === "admin"
        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
        : "bg-slate-500/20 text-slate-300 border-slate-500/30";
    return (
      <span
        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${colors}`}
      >
        {role.replace("_", " ")}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors =
      status === "approved"
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        : status === "rejected"
        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
        : "bg-amber-500/20 text-amber-300 border-amber-500/30";
    return (
      <span
        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${colors}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: "pending_approval", label: "Pending" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
            { id: "all", label: "All" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setStatusFilter(tab.id as "all" | "pending_approval" | "approved" | "rejected")
              }
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                statusFilter === tab.id
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-white/5 bg-white/5 text-sm text-white"
                >
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">{getStatusBadge(user.account_status)}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDateReadable(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.account_status === "pending_approval" && (
                        <>
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={loading === user.id}
                            className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            disabled={loading === user.id}
                            className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/30 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {user.account_status === "approved" && (
                        <button
                          onClick={() =>
                            setRoleChangeDialog({
                              isOpen: true,
                              userId: user.id,
                              currentRole: user.role,
                              userEmail: user.email,
                            })
                          }
                          disabled={loading === user.id}
                          className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/30 disabled:opacity-50"
                        >
                          Change Role
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RoleChangeDialog
        isOpen={roleChangeDialog.isOpen}
        onClose={() =>
          setRoleChangeDialog({
            isOpen: false,
            userId: "",
            currentRole: "",
            userEmail: "",
          })
        }
        currentRole={roleChangeDialog.currentRole}
        userEmail={roleChangeDialog.userEmail}
        onConfirm={async (newRole, password) => {
          await handleChangeRole(roleChangeDialog.userId, newRole, password);
        }}
      />
    </>
  );
}

