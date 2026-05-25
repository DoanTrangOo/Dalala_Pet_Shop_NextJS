import Link from "next/link";
import { Heart, Search, ShoppingCart } from "lucide-react";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/shop", label: "Cửa hàng" },
  { href: "/orders", label: "Đặt hàng" },
  { href: "/about", label: "Thông tin" },
  { href: "/contact", label: "Liên lạc" },
];

export function SiteHeader() {
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
          <Link
            href="/search"
            aria-label="Tìm kiếm"
            className="rounded-full border border-emerald-100 p-2 hover:text-emerald-700"
          >
            <Search className="h-4 w-4" />
          </Link>
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
            className="rounded-full border border-emerald-100 p-2 hover:text-emerald-700"
          >
            <ShoppingCart className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="hidden rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white sm:inline-flex"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
