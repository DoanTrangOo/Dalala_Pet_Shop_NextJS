import Link from "next/link";
import { Facebook, Github, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-emerald-100 bg-emerald-50/60">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Truy cập nhanh
          </h3>
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/" className="hover:text-emerald-700">Trang chủ</Link>
            <Link href="/shop" className="hover:text-emerald-700">Cửa hàng</Link>
            <Link href="/about" className="hover:text-emerald-700">Thông tin</Link>
            <Link href="/contact" className="hover:text-emerald-700">Liên lạc</Link>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Thông tin liên lạc
          </h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>091 2345 6789</p>
            <p>2100011@dlu.edu.vn</p>
            <p>Đà Lạt, Lâm Đồng</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Thành viên thực hiện
          </h3>
          <p className="text-sm text-slate-600">Nguyễn Đoan Trang</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Mạng xã hội
          </h3>
          <div className="flex items-center gap-3 text-slate-600">
            <Link href="#" className="rounded-full border border-emerald-200 p-2 hover:text-emerald-700">
              <Facebook className="h-4 w-4" />
            </Link>
            <Link href="#" className="rounded-full border border-emerald-200 p-2 hover:text-emerald-700">
              <Github className="h-4 w-4" />
            </Link>
            <Link href="#" className="rounded-full border border-emerald-200 p-2 hover:text-emerald-700">
              <Youtube className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
