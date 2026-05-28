import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: productCount }, { count: categoryCount }, { count: userCount }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

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
      </div>

      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        Hãy dùng menu bên trái để cập nhật sản phẩm, danh mục và người dùng. Các thay đổi sẽ áp dụng ngay cho cửa hàng.
      </div>
    </main>
  );
}
