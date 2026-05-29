import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type DashboardOrder = {
  id: string;
  user_id: string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  payment_status: "pending" | "awaiting_transfer" | "proof_submitted" | "paid" | "failed" | null;
  total_amount: number;
  created_at: string;
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: categoryCount },
    { count: userCount },
    { count: orderCount },
    { count: pendingOrderCount },
    { data: recentOrdersData },
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "paid"]),
    supabase
      .from("orders")
      .select("id, user_id, status, payment_status, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const recentOrders = (recentOrdersData ?? []) as DashboardOrder[];
  const userIds = Array.from(new Set(recentOrders.map((order) => order.user_id)));

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null }[] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const formatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Quản lý cửa hàng</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi nhanh và truy cập các khu vực quản trị chính.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Sản phẩm
          </p>
          <div className="mt-2 text-3xl font-semibold text-foreground">
            {productCount ?? 0}
          </div>
          <Link
            href="/admin/products"
            className="mt-4 inline-flex text-sm font-semibold text-primary"
          >
            Quản lý sản phẩm
          </Link>
        </div>
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Danh mục
          </p>
          <div className="mt-2 text-3xl font-semibold text-foreground">
            {categoryCount ?? 0}
          </div>
          <Link
            href="/admin/categories"
            className="mt-4 inline-flex text-sm font-semibold text-primary"
          >
            Quản lý danh mục
          </Link>
        </div>
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Người dùng
          </p>
          <div className="mt-2 text-3xl font-semibold text-foreground">
            {userCount ?? 0}
          </div>
          <Link
            href="/admin/users"
            className="mt-4 inline-flex text-sm font-semibold text-primary"
          >
            Quản lý người dùng
          </Link>
        </div>
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Đơn hàng
          </p>
          <div className="mt-2 text-3xl font-semibold text-foreground">
            {orderCount ?? 0}
          </div>
          <Link
            href="/admin/orders"
            className="mt-4 inline-flex text-sm font-semibold text-primary"
          >
            Xử lý đơn hàng
          </Link>
        </div>
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Đơn đang xử lý
          </p>
          <div className="mt-2 text-3xl font-semibold text-foreground">
            {pendingOrderCount ?? 0}
          </div>
          <p className="mt-4 inline-flex text-sm font-semibold text-primary">
            pending + paid chưa giao
          </p>
        </div>
      </div>

      <section className="rounded-xl border bg-background p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Đơn hàng gần đây</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-primary">
            Xem tất cả
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Đơn #{order.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Khách: {profileMap.get(order.user_id) || order.user_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-700">{formatter.format(Number(order.total_amount))}</p>
                  <p className="text-xs text-muted-foreground">{order.status} / {order.payment_status ?? "pending"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
