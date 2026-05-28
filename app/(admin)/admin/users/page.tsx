import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { updateUserRoleAction } from "@/app/(admin)/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: "admin" | "customer";
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });

  const adminClient = createAdminClient();
  const emailById = new Map<string, string>();
  let emailWarning: string | null = null;

  if (adminClient) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) {
      emailWarning = error.message;
    } else {
      (data.users ?? []).forEach((user) => {
        if (user.id && user.email) {
          emailById.set(user.id, user.email);
        }
      });
    }
  } else {
    emailWarning = "Thiếu SUPABASE_SERVICE_ROLE_KEY nên không thể tải email người dùng.";
  }

  const rows = (profiles ?? []) as ProfileRow[];

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Người dùng</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi tài khoản và phân quyền quản trị.
        </p>
      </div>

      {emailWarning ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {emailWarning}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Vai trò</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Chưa có người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium text-foreground">
                    {profile.full_name || "Chưa cập nhật"}
                  </TableCell>
                  <TableCell>{emailById.get(profile.id) ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {profile.id}
                  </TableCell>
                  <TableCell>
                    {new Date(profile.created_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <form action={updateUserRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={profile.id} />
                      <select
                        name="role"
                        defaultValue={profile.role}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button type="submit" size="sm">
                        Lưu
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
