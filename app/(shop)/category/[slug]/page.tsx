import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  product_images: { image_url: string; sort_order: number }[] | null;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, product_images(image_url, sort_order)")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("sort_order", { ascending: true, foreignTable: "product_images" });

  const items = (products ?? []) as ProductCard[];
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold text-emerald-700">{category.name}</h1>
        <p className="text-sm text-slate-600">
          {category.description ?? "Khám phá các sản phẩm thuộc danh mục này."}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-500">
            Danh mục này chưa có sản phẩm.
          </div>
        ) : (
          items.map((product) => {
            const cover = product.product_images?.[0]?.image_url ?? "/legacy/product1.png";
            return (
              <div
                key={product.id}
                className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
              >
                <Link href={`/product/${product.slug}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-emerald-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-emerald-700">
                    {formatter.format(Number(product.price))}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-emerald-900">
                    {product.name}
                  </h3>
                </Link>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  Liên hệ shop
                </Link>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
