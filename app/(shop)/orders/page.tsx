import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  product_images: { image_url: string; sort_order: number }[] | null;
  category: { name: string; slug: string } | null;
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, product_images(image_url, sort_order), category:categories(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("sort_order", { ascending: true, foreignTable: "product_images" })
    .limit(6);

  const items = (products ?? []) as ProductCard[];
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold text-emerald-700">Đặt hàng</h1>
        <p className="text-base text-slate-600">
          Chọn sản phẩm bạn quan tâm, xem chi tiết, rồi liên hệ shop để được tư vấn và chốt đơn.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Liên hệ shop
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-emerald-600 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Xem cửa hàng
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => {
          const cover = product.product_images?.[0]?.image_url ?? "/legacy/product1.png";

          return (
            <div key={product.id} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <Link href={`/product/${product.slug}`} className="block">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-emerald-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <div className="mt-4 text-sm font-semibold text-emerald-700">
                  {formatter.format(Number(product.price))}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-emerald-900">{product.name}</h3>
              </Link>
              <Link
                href="/contact"
                className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                Liên hệ shop
              </Link>
            </div>
          );
        })}
      </div>
    </main>
  );
}
