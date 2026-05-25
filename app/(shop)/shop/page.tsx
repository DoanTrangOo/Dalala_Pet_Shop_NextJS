import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, product_images(image_url, sort_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const items = products ?? [];
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold text-emerald-700">Cửa hàng</h1>
        <p className="text-base text-slate-600">Sản phẩm mới nhất tại Dalala Pet Store.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-500">
            Hiện tại chưa có sản phẩm.
          </div>
        ) : (
          items.map((product) => {
            const cover = product.product_images?.[0]?.image_url ?? "/legacy/product1.png";

            return (
              <div
                key={product.id}
                className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between text-sm text-emerald-700">
                  <span className="font-semibold">{formatter.format(Number(product.price))}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs">New</span>
                </div>
                <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-emerald-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-800">
                  {product.name}
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={`/product/${product.slug}`}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Xem chi tiết
                  </Link>
                  <button
                    type="button"
                    className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
