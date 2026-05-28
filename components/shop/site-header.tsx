import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

import { SearchDialog } from "./search-dialog";
import AvatarMenu from "./avatar-menu";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/shop", label: "Cửa hàng" },
  { href: "/orders", label: "Đặt hàng" },
  { href: "/about", label: "Thông tin" },
  { href: "/contact", label: "Liên lạc" },
];
export async function SiteHeader() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = profile?.role === "admin";
  let cartCount = 0;

  if (user) {
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cart?.id) {
      const { data: cartItems } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", cart.id);
      cartCount = (cartItems ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-emerald-700">
          Dalala Pet Store
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-emerald-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-slate-600">
          <SearchDialog />
          <Link
            href="/wishlist"
            aria-label="Danh sách yêu thích"
            className="rounded-full border border-emerald-100 p-2 hover:text-emerald-700"
          >
            <Heart className="h-4 w-4" />
          </Link>
          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            className="relative rounded-full border border-emerald-100 p-2 hover:text-emerald-700"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          {user ? (
            <AvatarMenu userEmail={user.email} isAdmin={isAdmin} />
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white sm:inline-flex"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
