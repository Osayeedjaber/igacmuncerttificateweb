import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import { Database } from "@/types/database";
import UserManagement from "@/components/dashboard/UserManagement";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export default async function UsersPage() {
  const user = await requireAdmin();
  
  // Only super admins can access user management
  if (user.role !== "super_admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-slate-400 mt-2">
            Access denied. Only super admins can manage users.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: usersData } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  const users: UserRow[] = usersData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <p className="text-slate-400 mt-2">
          Manage admin accounts and permissions.
        </p>
      </div>
      <UserManagement users={users} />
    </div>
  );
}

